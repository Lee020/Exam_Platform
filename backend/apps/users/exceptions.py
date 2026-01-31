"""
Custom exception handler for REST API
"""
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error format
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        response.data = {
            'status': 'error',
            'detail': response.data,
        }
    else:
        response = {
            'status': 'error',
            'detail': 'An unexpected error occurred',
        }

    return response
