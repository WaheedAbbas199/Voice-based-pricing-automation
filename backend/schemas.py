from typing import Literal, Optional
from pydantic import BaseModel, Field

QStatus = Literal["Draft", "Pending", "Sent", "Approved", "Rejected"]
HStatus = Literal["Completed", "Pending", "Failed"]
Role = Literal["Admin", "Manager", "Agent", "Viewer"]
EMAIL = r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
Money = dict(ge=0, le=1e9)


class CalcIn(BaseModel):
    qty: float = Field(gt=0, le=1e9)
    unitPrice: float = Field(ge=0, le=1e9)
    discount: float = Field(0, ge=0, le=100)
    tax: float = Field(0, ge=0, le=100)
    delivery: float = Field(0, **Money)
    extra: float = Field(0, **Money)


class HistoryIn(CalcIn):
    product: str = Field(min_length=1, max_length=200)
    unit: str = Field("unit", max_length=40)
    category: str = Field("", max_length=100)
    customer: str = Field("Walk-in", max_length=160)
    customerId: str = ""
    status: HStatus = "Completed"
    source: Literal["voice", "manual"] = "manual"


class HistoryPatch(BaseModel):
    qty: Optional[float] = Field(None, gt=0, le=1e9)
    unitPrice: Optional[float] = Field(None, ge=0, le=1e9)
    discount: Optional[float] = Field(None, ge=0, le=100)
    tax: Optional[float] = Field(None, ge=0, le=100)
    delivery: Optional[float] = Field(None, **Money)
    extra: Optional[float] = Field(None, **Money)
    status: Optional[HStatus] = None
    product: Optional[str] = Field(None, min_length=1, max_length=200)


class QuoteIn(CalcIn):
    product: str = Field(min_length=1, max_length=200)
    unit: str = Field("unit", max_length=40)
    customerId: str = ""
    customer: str = Field("", max_length=160)
    company: str = Field("", max_length=200)
    status: QStatus = "Draft"
    notes: str = Field("", max_length=2000)
    validUntil: Optional[str] = None


class QuotePatch(HistoryPatch):
    status: Optional[QStatus] = None
    customerId: Optional[str] = None
    unit: Optional[str] = Field(None, max_length=40)
    notes: Optional[str] = Field(None, max_length=2000)
    validUntil: Optional[str] = None


class CustomerIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    company: str = Field("", max_length=200)
    email: str = Field("", max_length=200, pattern=r"^$|" + EMAIL)
    phone: str = Field("", max_length=60)
    address: str = Field("", max_length=400)


class CustomerPatch(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=160)
    company: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=200, pattern=r"^$|" + EMAIL)
    phone: Optional[str] = Field(None, max_length=60)
    address: Optional[str] = Field(None, max_length=400)


class TranscribeIn(BaseModel):
    audioId: str | int


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=200, pattern=EMAIL)
    password: str = Field(min_length=8, max_length=200)


class LoginIn(BaseModel):
    email: str = Field(max_length=200)
    password: str = Field(max_length=200)
    remember: bool = False


class ForgotIn(BaseModel):
    email: str = Field(max_length=200)


class ResetIn(BaseModel):
    token: str = Field(max_length=200)
    password: str = Field(min_length=8, max_length=200)


class ChangePwIn(BaseModel):
    current: str = Field(max_length=200)
    new: str = Field(min_length=8, max_length=200)


class ProfileIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=200, pattern=EMAIL)


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=200, pattern=EMAIL)
    role: Role = "Agent"


class UserPatch(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    role: Optional[Role] = None
    status: Optional[Literal["Active", "Inactive"]] = None


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = Field("", max_length=100)
    unit: str = Field("unit", max_length=40)
    price: float = Field(0, **Money)
    active: bool = True


class ProductPatch(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=40)
    price: Optional[float] = Field(None, **Money)
    active: Optional[bool] = None


class ErrorPatch(BaseModel):
    resolved: bool


class ConfigIn(BaseModel):
    maxAudioMB: int = Field(ge=1, le=20)        # 20 MB = Gemini inline-audio request limit
    maxSeconds: int = Field(ge=1, le=3600)
    allowSignups: bool = True
    maintenance: bool = False
    autoDeleteDays: int = Field(30, ge=0, le=3650)
    maxDiscount: float = Field(25, ge=0, le=100)
