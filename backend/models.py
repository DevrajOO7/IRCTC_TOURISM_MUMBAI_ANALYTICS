from db import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import String
import uuid
import os

def UUID(as_uuid=True):
    if os.getenv('FLASK_ENV') == 'testing':
        return String(36)
    return PG_UUID(as_uuid=as_uuid)

def get_uuid():
    if os.getenv('FLASK_ENV') == 'testing':
        return str(uuid.uuid4())
    return uuid.uuid4()

class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    username = db.Column(db.String(255), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='viewer')  # admin, manager, viewer
    is_active = db.Column(db.Boolean, default=True)
    is_email_verified = db.Column(db.Boolean, default=False)
    email_verification_token = db.Column(db.String(255), nullable=True)
    password_reset_token = db.Column(db.String(255), nullable=True)
    password_reset_expires = db.Column(db.DateTime, nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    permissions = db.relationship('Permission', backref='user', lazy=True, cascade="all, delete-orphan")

    @property
    def permissions_list(self):
        """Return list of permissions for the user"""
        return [p.to_dict() for p in self.permissions]

    def to_dict(self):
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'is_email_verified': self.is_email_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
        }
    
    def is_locked(self):
        """Check if user account is locked"""
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True
        return False

class Passenger(db.Model):
    """Passenger model"""
    __tablename__ = 'passengers'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    transcation_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    master_passenger_name = db.Column(db.String(255), nullable=False, index=True)
    age = db.Column(db.Integer)
    dob = db.Column(db.Date)
    anniversary_date = db.Column(db.Date)
    gender = db.Column(db.String(50))
    email_id = db.Column(db.String(255), index=True)
    contact_number = db.Column(db.String(255))
    no_of_passenger = db.Column(db.Integer)
    booking_date = db.Column(db.DateTime, index=True)
    journey_date = db.Column(db.DateTime)
    boarding_point = db.Column(db.String(255))
    destination_point = db.Column(db.String(255))
    city = db.Column(db.String(255), nullable=False, index=True)
    state = db.Column(db.String(255), nullable=False, index=True)
    package_code = db.Column(db.String(255), index=True)
    package_name = db.Column(db.String(500))
    package_class = db.Column(db.String(100))
    status = db.Column(db.String(100), nullable=False, index=True)
    nominee_name = db.Column(db.String(255))
    nominee_relation = db.Column(db.String(100))
    nominee_contact = db.Column(db.String(255))
    international_client = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True, index=True)  # Soft delete
    remarks = db.Column(db.Text, nullable=True)
    remarks_updated_at = db.Column(db.DateTime, nullable=True)
    remarks_updated_by = db.Column(db.String(255), nullable=True)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'transcation_id': self.transcation_id,
            'master_passenger_name': self.master_passenger_name,
            'age': self.age,
            'dob': self.dob.isoformat() if self.dob else None,
            'anniversary_date': self.anniversary_date.isoformat() if self.anniversary_date else None,
            'gender': self.gender,
            'email_id': self.email_id,
            'contact_number': self.contact_number,
            'no_of_passenger': self.no_of_passenger,
            'booking_date': self.booking_date.isoformat() if self.booking_date else None,
            'journey_date': self.journey_date.isoformat() if self.journey_date else None,
            'boarding_point': self.boarding_point,
            'destination_point': self.destination_point,
            'city': self.city,
            'state': self.state,
            'package_code': self.package_code,
            'package_name': self.package_name,
            'package_class': self.package_class,
            'status': self.status,
            'nominee_name': self.nominee_name,
            'nominee_relation': self.nominee_relation,
            'nominee_contact': self.nominee_contact,
            'international_client': self.international_client,
            'remarks': self.remarks,
            'remarks_updated_at': self.remarks_updated_at.isoformat() if self.remarks_updated_at else None,
            'remarks_updated_by': self.remarks_updated_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

class Nominee(db.Model):
    """Nominee model"""
    __tablename__ = 'nominees'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    passenger_id = db.Column(UUID(as_uuid=True), db.ForeignKey('passengers.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    relation = db.Column(db.String(100))
    contact = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'passenger_id': str(self.passenger_id),
            'name': self.name,
            'relation': self.relation,
            'contact': self.contact,
        }

class Permission(db.Model):
    """Permission model for role-based access control"""
    __tablename__ = 'permissions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True)
    module_name = db.Column(db.String(100), nullable=False)  # passengers, packages, reports, analytics, users
    can_view = db.Column(db.Boolean, default=False)
    can_edit = db.Column(db.Boolean, default=False)
    can_delete = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'module_name', name='unique_user_module'),)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'module_name': self.module_name,
            'can_view': self.can_view,
            'can_edit': self.can_edit,
            'can_delete': self.can_delete,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }



class AuditLog(db.Model):
    """Audit log for system actions"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True, index=True)
    action = db.Column(db.String(255), nullable=False, index=True)
    resource_type = db.Column(db.String(100), nullable=True)
    resource_id = db.Column(db.String(255), nullable=True)
    details = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id) if self.user_id else None,
            'user_email': self.user.email if self.user else 'System/Unknown',
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat()
        }

class UserSession(db.Model):
    """User session history"""
    __tablename__ = 'user_sessions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True)
    token_jti = db.Column(db.String(255), nullable=True) # JWT ID if needed
    login_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active_at = db.Column(db.DateTime, default=datetime.utcnow)
    logout_at = db.Column(db.DateTime, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    device_info = db.Column(db.JSON, nullable=True)
    duration_minutes = db.Column(db.Float, nullable=True)

    user = db.relationship('User', backref=db.backref('sessions', lazy=True))

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'login_at': self.login_at.isoformat(),
            'last_active_at': self.last_active_at.isoformat() if self.last_active_at else None,
            'logout_at': self.logout_at.isoformat() if self.logout_at else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'duration_minutes': self.duration_minutes
        }
