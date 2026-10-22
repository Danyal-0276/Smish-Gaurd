from django.test import SimpleTestCase, override_settings


@override_settings(ALLOWED_HOSTS=["testserver"])
class FoundationTests(SimpleTestCase):
    def test_health_without_business_queries(self):
        response = self.client.get("/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["stage"], "foundation")

    def test_no_analysis_endpoint(self):
        self.assertEqual(self.client.post("/api/v1/analyze").status_code, 404)
