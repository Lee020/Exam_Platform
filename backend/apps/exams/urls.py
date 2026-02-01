from rest_framework import routers
from .views import ExamViewSet, ExamQuestionViewSet

router = routers.DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exam')
# ExamQuestion is mostly managed via Exam, but can have direct access if needed
router.register(r'exam-questions', ExamQuestionViewSet, basename='exam-question')

urlpatterns = router.urls
