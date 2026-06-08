from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from datetime import datetime, timezone
from app.db.mongodb import get_db
from app.models.user import UserRegister, UserLogin, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    """Dependency to retrieve and validate the currently logged-in user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    user_id: str = payload.get("user_id")
    if email is None or user_id is None:
        raise credentials_exception
        
    # Query MongoDB for user
    try:
        user_doc = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception
        
    if user_doc is None:
        raise credentials_exception
        
    # Map _id to str for user response compatibility
    user_doc["_id"] = str(user_doc["_id"])
    return user_doc

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, user_data: UserRegister, db=Depends(get_db)):
    """Register a new user in MongoDB."""
    # Check if email exists
    existing_user = await db["users"].find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Hash the password and structure user document
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Insert user
    result = await db["users"].insert_one(user_dict)
    
    # Fetch and return created user
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    return created_user

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin, db=Depends(get_db)):
    """Authenticate user and return JWT access token."""
    user_doc = await db["users"].find_one({"email": credentials.email})
    if not user_doc or not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate access token
    access_token = create_access_token(
        data={"sub": user_doc["email"], "user_id": str(user_doc["_id"])}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get profile of current logged-in user."""
    return current_user
