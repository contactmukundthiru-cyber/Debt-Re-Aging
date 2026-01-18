"""
Performance Optimization Module
Implements caching, async operations, and performance monitoring

Designed to improve responsiveness for large documents and batch operations.
"""

import hashlib
import json
import time
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, Callable, TypeVar, Generic
from functools import wraps
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging


# Setup
CACHE_DIR = Path(__file__).parent.parent / 'cache'
CACHE_DIR.mkdir(exist_ok=True)

logger = logging.getLogger('performance')

T = TypeVar('T')


@dataclass
class CacheEntry:
    """A cached item with metadata."""
    key: str
    value: Any
    created_at: str
    expires_at: str
    hit_count: int = 0


@dataclass
class PerformanceMetrics:
    """Performance metrics for monitoring."""
    operation: str
    duration_ms: float
    success: bool
    cache_hit: bool = False
    items_processed: int = 1
    timestamp: str = ""


class Cache:
    """Simple file-based cache with TTL support."""

    def __init__(self, namespace: str = "default", ttl_hours: int = 24):
        self.namespace = namespace
        self.ttl_hours = ttl_hours
        self.cache_file = CACHE_DIR / f"{namespace}_cache.json"
        self._cache: Dict[str, CacheEntry] = {}
        self._load()

    def _load(self):
        """Load cache from file."""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r') as f:
                    data = json.load(f)
                    for key, entry_dict in data.items():
                        self._cache[key] = CacheEntry(**entry_dict)
            except (json.JSONDecodeError, KeyError):
                self._cache = {}

    def _save(self):
        """Save cache to file."""
        data = {k: asdict(v) for k, v in self._cache.items()}
        with open(self.cache_file, 'w') as f:
            json.dump(data, f)

    def _generate_key(self, *args, **kwargs) -> str:
        """Generate a cache key from arguments."""
        key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True, default=str)
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Get an item from cache."""
        if key not in self._cache:
            return None

        entry = self._cache[key]

        # Check expiration
        if datetime.fromisoformat(entry.expires_at) < datetime.now():
            del self._cache[key]
            self._save()
            return None

        # Update hit count
        entry.hit_count += 1
        self._save()

        return entry.value

    def set(self, key: str, value: Any):
        """Set an item in cache."""
        now = datetime.now()
        entry = CacheEntry(
            key=key,
            value=value,
            created_at=now.isoformat(),
            expires_at=(now + timedelta(hours=self.ttl_hours)).isoformat(),
            hit_count=0
        )
        self._cache[key] = entry
        self._save()

    def delete(self, key: str):
        """Delete an item from cache."""
        if key in self._cache:
            del self._cache[key]
            self._save()

    def clear(self):
        """Clear all cached items."""
        self._cache = {}
        self._save()

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_hits = sum(e.hit_count for e in self._cache.values())
        return {
            'namespace': self.namespace,
            'items': len(self._cache),
            'total_hits': total_hits,
            'ttl_hours': self.ttl_hours
        }


# Global caches
_parsing_cache = Cache('parsing', ttl_hours=24)
_ocr_cache = Cache('ocr', ttl_hours=48)
_rule_cache = Cache('rules', ttl_hours=1)


def cached(cache: Cache = None, ttl_hours: int = 24):
    """Decorator to cache function results."""
    if cache is None:
        cache = Cache('default', ttl_hours)

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            key = cache._generate_key(func.__name__, *args, **kwargs)

            # Check cache
            cached_result = cache.get(key)
            if cached_result is not None:
                return cached_result

            # Execute function
            result = func(*args, **kwargs)

            # Cache result
            cache.set(key, result)

            return result

        return wrapper
    return decorator


def timed(operation_name: str = None):
    """Decorator to time function execution."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            op_name = operation_name or func.__name__
            start = time.time()
            success = True

            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                success = False
                raise
            finally:
                duration_ms = (time.time() - start) * 1000
                metrics = PerformanceMetrics(
                    operation=op_name,
                    duration_ms=duration_ms,
                    success=success,
                    timestamp=datetime.now().isoformat()
                )
                _log_metrics(metrics)

        return wrapper
    return decorator


def _log_metrics(metrics: PerformanceMetrics):
    """Log performance metrics."""
    logger.info(
        f"[PERF] {metrics.operation}: {metrics.duration_ms:.2f}ms "
        f"({'OK' if metrics.success else 'FAIL'})"
    )


class BatchProcessor:
    """Process multiple items in parallel with progress tracking."""

    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

    def process_batch(
        self,
        items: list,
        processor: Callable,
        progress_callback: Callable = None
    ) -> list:
        """
        Process a batch of items in parallel.

        Args:
            items: List of items to process
            processor: Function to apply to each item
            progress_callback: Optional callback(current, total) for progress updates

        Returns:
            List of results in same order as input items
        """
        results = [None] * len(items)
        completed = 0

        futures = {
            self.executor.submit(processor, item): i
            for i, item in enumerate(items)
        }

        for future in as_completed(futures):
            idx = futures[future]
            try:
                results[idx] = {'success': True, 'result': future.result()}
            except Exception as e:
                results[idx] = {'success': False, 'error': str(e)}

            completed += 1
            if progress_callback:
                progress_callback(completed, len(items))

        return results

    def shutdown(self):
        """Shutdown the executor."""
        self.executor.shutdown(wait=True)


class LazyLoader(Generic[T]):
    """Lazy loading wrapper for expensive resources."""

    def __init__(self, loader: Callable[[], T]):
        self._loader = loader
        self._value: Optional[T] = None
        self._loaded = False
        self._lock = threading.Lock()

    @property
    def value(self) -> T:
        """Get the lazily loaded value."""
        if not self._loaded:
            with self._lock:
                if not self._loaded:
                    self._value = self._loader()
                    self._loaded = True
        return self._value

    def reset(self):
        """Reset the lazy loader."""
        with self._lock:
            self._value = None
            self._loaded = False


# Lazy loaders for expensive resources
_tesseract_engine = None
_pdf_reader = None


def get_tesseract():
    """Get or initialize Tesseract OCR engine."""
    global _tesseract_engine
    if _tesseract_engine is None:
        import pytesseract
        _tesseract_engine = pytesseract
    return _tesseract_engine


def get_pdf_reader():
    """Get or initialize PDF reader."""
    global _pdf_reader
    if _pdf_reader is None:
        import fitz
        _pdf_reader = fitz
    return _pdf_reader


@cached(_parsing_cache)
def cached_parse_text(text: str) -> Dict:
    """Cache-enabled text parsing."""
    from app.parser import parse_credit_report, fields_to_editable_dict
    parsed = parse_credit_report(text)
    return fields_to_editable_dict(parsed)


@cached(_rule_cache)
def cached_run_rules(fields_json: str) -> list:
    """Cache-enabled rule checking."""
    from app.rules import run_rules
    fields = json.loads(fields_json)
    return run_rules(fields)


def optimize_text(text: str) -> str:
    """Optimize text for faster parsing."""
    # Remove excessive whitespace
    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        # Skip mostly empty lines
        stripped = line.strip()
        if len(stripped) > 0:
            cleaned_lines.append(stripped)

    return '\n'.join(cleaned_lines)


def chunk_text(text: str, chunk_size: int = 5000) -> list:
    """Split text into manageable chunks for processing."""
    lines = text.split('\n')
    chunks = []
    current_chunk = []
    current_size = 0

    for line in lines:
        line_size = len(line)
        if current_size + line_size > chunk_size and current_chunk:
            chunks.append('\n'.join(current_chunk))
            current_chunk = []
            current_size = 0

        current_chunk.append(line)
        current_size += line_size

    if current_chunk:
        chunks.append('\n'.join(current_chunk))

    return chunks


class ProgressTracker:
    """Track and report progress for long operations."""

    def __init__(self, total: int, operation: str = "Processing"):
        self.total = total
        self.current = 0
        self.operation = operation
        self.start_time = time.time()
        self.callbacks = []

    def add_callback(self, callback: Callable):
        """Add a progress callback."""
        self.callbacks.append(callback)

    def update(self, amount: int = 1):
        """Update progress."""
        self.current += amount
        progress = self.current / self.total if self.total > 0 else 0

        for callback in self.callbacks:
            callback(self.current, self.total, progress)

    def get_eta(self) -> Optional[float]:
        """Get estimated time remaining in seconds."""
        if self.current == 0:
            return None

        elapsed = time.time() - self.start_time
        rate = self.current / elapsed
        remaining = self.total - self.current

        return remaining / rate if rate > 0 else None

    def get_stats(self) -> Dict:
        """Get progress statistics."""
        elapsed = time.time() - self.start_time
        return {
            'current': self.current,
            'total': self.total,
            'progress': self.current / self.total if self.total > 0 else 0,
            'elapsed_seconds': elapsed,
            'eta_seconds': self.get_eta(),
            'rate': self.current / elapsed if elapsed > 0 else 0
        }


def clear_all_caches():
    """Clear all application caches."""
    _parsing_cache.clear()
    _ocr_cache.clear()
    _rule_cache.clear()


def get_cache_stats() -> Dict:
    """Get statistics for all caches."""
    return {
        'parsing': _parsing_cache.get_stats(),
        'ocr': _ocr_cache.get_stats(),
        'rules': _rule_cache.get_stats()
    }


def render_performance_settings(st):
    """Render performance settings UI in Streamlit."""
    st.subheader("Performance Settings")

    # Cache management
    st.markdown("#### Cache Management")

    stats = get_cache_stats()

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Parsing Cache", f"{stats['parsing']['items']} items")
    with col2:
        st.metric("OCR Cache", f"{stats['ocr']['items']} items")
    with col3:
        st.metric("Rules Cache", f"{stats['rules']['items']} items")

    if st.button("Clear All Caches"):
        clear_all_caches()
        st.success("All caches cleared!")
        st.rerun()

    # Batch processing settings
    st.markdown("#### Batch Processing")

    max_workers = st.slider(
        "Parallel Workers",
        min_value=1,
        max_value=8,
        value=4,
        help="Number of parallel threads for batch processing"
    )

    # Performance tips
    st.markdown("#### Performance Tips")
    st.info("""
    - **For faster processing:** Upload PDF files instead of images when possible
    - **For batch operations:** Keep files under 5MB each
    - **Clear caches** periodically if you're processing many different reports
    """)
