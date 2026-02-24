"""
Performance monitoring and metrics collection
"""
import os
import time
from datetime import datetime
from functools import wraps
import json

class PerformanceMonitor:
    """Monitors application performance"""
    
    def __init__(self):
        """Initialize performance monitor"""
        self.metrics = {
            'requests': [],
            'database_queries': [],
            'errors': [],
            'cache_hits': 0,
            'cache_misses': 0
        }
        self.datadog_enabled = os.getenv('DATADOG_ENABLED', 'false').lower() == 'true'
        
        if self.datadog_enabled:
            try:
                from datadog import initialize, api
                options = {
                    'api_key': os.getenv('DATADOG_API_KEY'),
                    'app_key': os.getenv('DATADOG_APP_KEY')
                }
                initialize(**options)
                self.datadog = api
                print("✓ Datadog monitoring enabled")
            except Exception as e:
                print(f"⚠ Datadog initialization failed: {e}")
                self.datadog_enabled = False
    
    def record_request(self, method, endpoint, status_code, duration):
        """Record API request metrics"""
        metric = {
            'timestamp': datetime.now().isoformat(),
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            'duration_ms': duration * 1000
        }
        
        self.metrics['requests'].append(metric)
        
        # Send to Datadog
        if self.datadog_enabled:
            try:
                self.datadog.Metric.send(
                    metric='passenger_analytics.request.duration',
                    points=duration * 1000,
                    tags=[
                        f'method:{method}',
                        f'endpoint:{endpoint}',
                        f'status:{status_code}'
                    ]
                )
            except Exception as e:
                print(f"Datadog metric error: {e}")
        
        # Keep only last 1000 requests
        if len(self.metrics['requests']) > 1000:
            self.metrics['requests'] = self.metrics['requests'][-1000:]
    
    def record_database_query(self, query, duration, rows_affected=0):
        """Record database query metrics"""
        metric = {
            'timestamp': datetime.now().isoformat(),
            'query': query[:100],  # First 100 chars
            'duration_ms': duration * 1000,
            'rows_affected': rows_affected
        }
        
        self.metrics['database_queries'].append(metric)
        
        # Send to Datadog
        if self.datadog_enabled:
            try:
                self.datadog.Metric.send(
                    metric='passenger_analytics.database.query_duration',
                    points=duration * 1000,
                    tags=['type:database']
                )
            except Exception as e:
                print(f"Datadog metric error: {e}")
        
        # Keep only last 500 queries
        if len(self.metrics['database_queries']) > 500:
            self.metrics['database_queries'] = self.metrics['database_queries'][-500:]
    
    def record_error(self, error_type, message, traceback=None):
        """Record error metrics"""
        metric = {
            'timestamp': datetime.now().isoformat(),
            'type': error_type,
            'message': message,
            'traceback': traceback
        }
        
        self.metrics['errors'].append(metric)
        
        # Send to Datadog
        if self.datadog_enabled:
            try:
                self.datadog.Metric.send(
                    metric='passenger_analytics.error.count',
                    points=1,
                    tags=[f'error_type:{error_type}']
                )
            except Exception as e:
                print(f"Datadog metric error: {e}")
        
        # Keep only last 100 errors
        if len(self.metrics['errors']) > 100:
            self.metrics['errors'] = self.metrics['errors'][-100:]
    
    def record_cache_hit(self):
        """Record cache hit"""
        self.metrics['cache_hits'] += 1
        
        if self.datadog_enabled:
            try:
                self.datadog.Metric.send(
                    metric='passenger_analytics.cache.hit',
                    points=1
                )
            except Exception as e:
                print(f"Datadog metric error: {e}")
    
    def record_cache_miss(self):
        """Record cache miss"""
        self.metrics['cache_misses'] += 1
        
        if self.datadog_enabled:
            try:
                self.datadog.Metric.send(
                    metric='passenger_analytics.cache.miss',
                    points=1
                )
            except Exception as e:
                print(f"Datadog metric error: {e}")
    
    def get_metrics(self):
        """Get all collected metrics"""
        cache_total = self.metrics['cache_hits'] + self.metrics['cache_misses']
        cache_hit_rate = (self.metrics['cache_hits'] / cache_total * 100) if cache_total > 0 else 0
        
        # Calculate average request duration
        avg_request_duration = 0
        if self.metrics['requests']:
            total_duration = sum(r['duration_ms'] for r in self.metrics['requests'])
            avg_request_duration = total_duration / len(self.metrics['requests'])
        
        # Calculate average query duration
        avg_query_duration = 0
        if self.metrics['database_queries']:
            total_duration = sum(q['duration_ms'] for q in self.metrics['database_queries'])
            avg_query_duration = total_duration / len(self.metrics['database_queries'])
        
        return {
            'summary': {
                'total_requests': len(self.metrics['requests']),
                'total_errors': len(self.metrics['errors']),
                'total_queries': len(self.metrics['database_queries']),
                'cache_hits': self.metrics['cache_hits'],
                'cache_misses': self.metrics['cache_misses'],
                'cache_hit_rate': f"{cache_hit_rate:.2f}%"
            },
            'averages': {
                'request_duration_ms': f"{avg_request_duration:.2f}",
                'query_duration_ms': f"{avg_query_duration:.2f}"
            },
            'recent_requests': self.metrics['requests'][-10:],
            'recent_errors': self.metrics['errors'][-10:],
            'slow_queries': sorted(
                self.metrics['database_queries'],
                key=lambda x: x['duration_ms'],
                reverse=True
            )[:10]
        }
    
    def reset_metrics(self):
        """Reset all metrics"""
        self.metrics = {
            'requests': [],
            'database_queries': [],
            'errors': [],
            'cache_hits': 0,
            'cache_misses': 0
        }

# Global monitor instance
monitor = None

def init_monitoring(app):
    """Initialize monitoring with Flask app"""
    global monitor
    monitor = PerformanceMonitor()
    return monitor

def get_monitor():
    """Get monitor instance"""
    global monitor
    if monitor is None:
        monitor = PerformanceMonitor()
    return monitor

def monitor_request(f):
    """Decorator to monitor request performance"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        monitor = get_monitor()
        start_time = time.time()
        
        try:
            result = f(*args, **kwargs)
            duration = time.time() - start_time
            
            # Extract method and endpoint from Flask context
            from flask import request
            monitor.record_request(
                request.method,
                request.endpoint or 'unknown',
                200,
                duration
            )
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            monitor.record_error(type(e).__name__, str(e))
            raise
    
    return decorated_function

def monitor_database_query(query_func):
    """Decorator to monitor database queries"""
    @wraps(query_func)
    def decorated_function(*args, **kwargs):
        monitor = get_monitor()
        start_time = time.time()
        
        try:
            result = query_func(*args, **kwargs)
            duration = time.time() - start_time
            
            # Extract query string if available
            query_str = str(args[0]) if args else 'unknown'
            monitor.record_database_query(query_str, duration)
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            monitor.record_error('DatabaseError', str(e))
            raise
    
    return decorated_function
