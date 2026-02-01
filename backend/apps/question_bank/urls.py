from rest_framework import routers
from .views import SubjectViewSet, TopicViewSet, QuestionViewSet

router = routers.DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'questions', QuestionViewSet, basename='question')

urlpatterns = router.urls
