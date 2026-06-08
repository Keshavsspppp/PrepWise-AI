from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr

class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    
    # We allow populating models by alias/field name (for MongoDB compatibility)
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "60c72b2f9b1d8b2a3c8e4f5a",
                "name": "Alex Student",
                "email": "alex@studygenie.ai"
            }
        }
    }

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
