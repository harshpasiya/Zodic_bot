from fastapi import FastAPI, HTTPException, Cookie, Response, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import os
import uuid
import pymongo
from pymongo import MongoClient
import json
from bson import ObjectId
import requests

# MongoDB setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'zodic_trading')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# FastAPI app setup
app = FastAPI(title="ZODIC Trading Bot API", version="1.0.0")

# CORS setup
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "client"  # "admin" or "client"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_active: bool = True

    class Config:
        populate_by_name = True

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TradingBot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    strategy: str
    capital: float
    risk_percentage: float = 2.0
    is_active: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    performance: Dict[str, Any] = Field(default_factory=dict)

class Trade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    bot_id: str
    symbol: str
    action: str  # "BUY" or "SELL"
    quantity: int
    price: float
    executed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "EXECUTED"  # "PENDING", "EXECUTED", "FAILED"

class Portfolio(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    total_value: float = 0.0
    cash_balance: float = 10000.0  # Starting balance
    positions: List[Dict[str, Any]] = Field(default_factory=list)
    daily_pnl: float = 0.0
    total_pnl: float = 0.0
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Authentication helper functions
async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> Optional[User]:
    """Get current user from session token (cookie first, then header)"""
    token = session_token
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        return None
    
    # Check session in database
    session_data = await db.sessions.find_one({'session_token': token})
    if not session_data:
        return None
    
    # Check if session is expired
    expires_at = datetime.fromisoformat(session_data['expires_at'])
    if expires_at < datetime.now(timezone.utc):
        await db.sessions.delete_one({'session_token': token})
        return None
    
    # Get user data
    user_data = await db.users.find_one({'id': session_data['user_id']})
    if not user_data:
        return None
    
    return User(**user_data)

# Mock Indian stock data
INDIAN_STOCKS = {
    "RELIANCE": {"price": 2456.75, "change": 12.30, "volume": 1250000},
    "TCS": {"price": 3890.20, "change": -15.80, "volume": 890000},
    "INFY": {"price": 1678.45, "change": 25.60, "volume": 1100000},
    "HDFCBANK": {"price": 1545.30, "change": 8.70, "volume": 2100000},
    "ICICIBANK": {"price": 987.65, "change": -3.25, "volume": 1850000},
    "WIPRO": {"price": 432.15, "change": 7.80, "volume": 650000},
    "BHARTIARTL": {"price": 825.40, "change": -2.10, "volume": 980000},
    "ITC": {"price": 456.20, "change": 4.50, "volume": 1650000}
}

# API Routes

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Authentication endpoints
@app.post("/api/auth/session")
async def create_session(request: Request, response: Response, x_session_id: str = Header(..., alias="X-Session-ID")):
    """Process session ID from Emergent Auth and create user session"""
    try:
        # Call Emergent auth service to get user data
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        user_data = auth_response.json()
        
        # Check if user exists, if not create new user
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if not existing_user:
            # Create new user with default role as client
            new_user = User(
                email=user_data["email"],
                name=user_data["name"],
                picture=user_data.get("picture"),
                role="client"  # Default role
            )
            await db.users.insert_one(new_user.dict())
            
            # Create initial portfolio for new user
            portfolio = Portfolio(user_id=new_user.id)
            await db.portfolios.insert_one(portfolio.dict())
            
            user = new_user
        else:
            user = User(**existing_user)
        
        # Create session with 7-day expiry
        session_token = user_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session = Session(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at.isoformat()
        )
        
        await db.sessions.insert_one(session.dict())
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        return {
            "user": user.dict(),
            "message": "Session created successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")

@app.get("/api/auth/me")
async def get_current_user_info(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get current authenticated user info"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.dict()

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user and clear session"""
    if session_token:
        await db.sessions.delete_one({'session_token': session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# User management (Admin only)
@app.get("/api/admin/users", response_model=List[User])
async def get_all_users(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all users (Admin only)"""
    current_user = await get_current_user(request, session_token)
    if not current_user or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find().to_list(length=None)
    return [User(**user) for user in users]

@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update user role (Admin only)"""
    current_user = await get_current_user(request, session_token)
    if not current_user or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if role not in ["admin", "client"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated successfully"}

# Trading bot endpoints
@app.get("/api/bots", response_model=List[TradingBot])
async def get_user_bots(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get user's trading bots"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    bots = await db.trading_bots.find({"user_id": user.id}).to_list(length=None)
    return [TradingBot(**bot) for bot in bots]

@app.post("/api/bots", response_model=TradingBot)
async def create_bot(bot_data: dict, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create new trading bot"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    bot = TradingBot(
        user_id=user.id,
        name=bot_data["name"],
        strategy=bot_data["strategy"],
        capital=bot_data["capital"],
        risk_percentage=bot_data.get("risk_percentage", 2.0)
    )
    
    await db.trading_bots.insert_one(bot.dict())
    return bot

@app.put("/api/bots/{bot_id}/toggle")
async def toggle_bot(bot_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Toggle bot active status"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    bot = await db.trading_bots.find_one({"id": bot_id, "user_id": user.id})
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    new_status = not bot["is_active"]
    await db.trading_bots.update_one(
        {"id": bot_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"message": f"Bot {'activated' if new_status else 'deactivated'} successfully"}

# Market data endpoints
@app.get("/api/market/stocks")
async def get_market_data():
    """Get mock Indian stock market data"""
    return INDIAN_STOCKS

@app.get("/api/market/stocks/{symbol}")
async def get_stock_data(symbol: str):
    """Get specific stock data"""
    if symbol.upper() not in INDIAN_STOCKS:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    return {symbol.upper(): INDIAN_STOCKS[symbol.upper()]}

# Portfolio endpoints
@app.get("/api/portfolio", response_model=Portfolio)
async def get_portfolio(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get user's portfolio"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    portfolio = await db.portfolios.find_one({"user_id": user.id})
    if not portfolio:
        # Create portfolio if it doesn't exist
        new_portfolio = Portfolio(user_id=user.id)
        await db.portfolios.insert_one(new_portfolio.dict())
        return new_portfolio
    
    return Portfolio(**portfolio)

# Trading history endpoints
@app.get("/api/trades", response_model=List[Trade])
async def get_trades(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get user's trading history"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    trades = await db.trades.find({"user_id": user.id}).sort("executed_at", -1).to_list(length=100)
    return [Trade(**trade) for trade in trades]

# Analytics endpoints
@app.get("/api/analytics/overview")
async def get_analytics_overview(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get analytics overview"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Mock analytics data
    if user.role == "admin":
        return {
            "total_users": await db.users.count_documents({}),
            "active_bots": await db.trading_bots.count_documents({"is_active": True}),
            "total_trades_today": await db.trades.count_documents({}),
            "platform_pnl": 125430.50,
            "revenue": 8920.75
        }
    else:
        user_bots = await db.trading_bots.count_documents({"user_id": user.id})
        user_trades = await db.trades.count_documents({"user_id": user.id})
        portfolio = await db.portfolios.find_one({"user_id": user.id})
        
        return {
            "total_bots": user_bots,
            "active_bots": await db.trading_bots.count_documents({"user_id": user.id, "is_active": True}),
            "trades_today": user_trades,
            "portfolio_value": portfolio["total_value"] if portfolio else 0,
            "daily_pnl": portfolio["daily_pnl"] if portfolio else 0
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)