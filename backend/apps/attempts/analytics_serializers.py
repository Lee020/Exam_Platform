from rest_framework import serializers
from .models import Attempt
from apps.users.serializers import UserSerializer

class ExamAttemptAnalyticsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Attempt
        fields = ['id', 'username', 'start_time', 'status', 'score']
        read_only_fields = fields
