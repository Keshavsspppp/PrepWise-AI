from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import secrets
from app.db.mongodb import get_db
from app.models.user import UserRegister, UserLogin, UserResponse, Token, RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token, create_refresh_token, decode_refresh_token
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
    
    # Check blocklist first
    is_blocked = await db["token_blocklist"].find_one({"token": token})
    if is_blocked:
        raise credentials_exception
        
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
        
    # Generate access and refresh tokens
    access_token = create_access_token(
        data={"sub": user_doc["email"], "user_id": str(user_doc["_id"])}
    )
    refresh_token = create_refresh_token(
        data={"sub": user_doc["email"], "user_id": str(user_doc["_id"])}
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
@limiter.limit("5/minute")
async def refresh(request: Request, payload: RefreshRequest, db=Depends(get_db)):
    """Refresh JWT access token using refresh token."""
    token_data = decode_refresh_token(payload.refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate new access and refresh tokens
    new_access = create_access_token(
        data={"sub": token_data["sub"], "user_id": token_data["user_id"]}
    )
    new_refresh = create_refresh_token(
        data={"sub": token_data["sub"], "user_id": token_data["user_id"]}
    )
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer"
    }

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get profile of current logged-in user."""
    return current_user

@router.post("/logout")
async def logout(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Logout current user and invalidate access token."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        if payload:
            exp = payload.get("exp")
            # Convert epoch to datetime
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc) + timedelta(hours=1)
            await db["token_blocklist"].update_one(
                {"token": token},
                {"$set": {"token": token, "expires_at": expires_at, "blacklisted_at": datetime.now(timezone.utc)}},
                upsert=True
            )
    return {"message": "Successfully logged out"}

@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db=Depends(get_db)
):
    """Generate a password reset token and print reset link to server console."""
    user = await db["users"].find_one({"email": payload.email})
    # For security reasons, do not explicitly reveal if email exists or not,
    # but we generate and log the reset link if it does exist.
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        await db["password_resets"].update_one(
            {"email": payload.email},
            {"$set": {"email": payload.email, "token": token, "expires_at": expires_at}},
            upsert=True
        )
        
        # Construct and log reset link
        reset_link = f"http://localhost:5173/#/reset-password?token={token}&email={payload.email}"
        print("\n" + "="*80)
        print(f" PASSWORD RESET REQUEST RECEIVED FOR: {payload.email}")
        print(f" RESET LINK: {reset_link}")
        print("="*80 + "\n")
        
    return {
        "message": "If the email is registered, a password reset link has been logged to the server console."
    }

@router.post("/reset-password")
@limiter.limit("3/minute")
async def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db=Depends(get_db)
):
    """Reset user password using token."""
    reset_entry = await db["password_resets"].find_one({
        "email": payload.email,
        "token": payload.token
    })
    
    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
        
    # Check if token is expired
    expires_at = reset_entry["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expires_at:
        await db["password_resets"].delete_one({"_id": reset_entry["_id"]})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired."
        )
        
    # Validation of new password is automatically done by Pydantic schema validation
    # in the request payload (which uses validate_password from user.py if we enforce it).
    # Wait, ResetPasswordRequest does not inherit from UserRegister but we can validate it manually or enforce it!
    # Let's validate it using the classmethod validator manually:
    try:
        from app.models.user import UserRegister
        UserRegister.validate_password(payload.new_password)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
        
    # Update password
    hashed_password = get_password_hash(payload.new_password)
    await db["users"].update_one(
        {"email": payload.email},
        {"$set": {"password": hashed_password}}
    )
    
    # Delete reset token
    await db["password_resets"].delete_one({"_id": reset_entry["_id"]})
    
    return {"message": "Password reset successful."}

