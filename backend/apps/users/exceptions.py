"""
Custom exception handler for REST API
"""
from django.utils import timezone
from rest_framework.views import exception_handler as drf_exception_handler


import traceback
import os
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

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
        # Unexpected error (500)
        tb = traceback.format_exc()
        try:
            with open('backend_errors.log', 'a') as f:
                f.write(f"\n--- ERROR at {timezone.now()} ---\n")
                f.write(tb)
        except:
            pass
            
        detail = str(exc)
        if settings.DEBUG:
            detail = tb
            
        response = Response({
            'status': 'error',
            'detail': detail,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
