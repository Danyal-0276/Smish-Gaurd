import logging


class SafeRequestFilter(logging.Filter):
    """Safe to import before Django populates its app registry."""
    def filter(self, record):
        record.msg = "HTTP request completed"
        record.args = ()
        record.exc_info = None
        record.exc_text = None
        record.stack_info = None
        return True
