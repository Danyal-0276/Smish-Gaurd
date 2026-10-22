from django.test import SimpleTestCase, override_settings


@override_settings(ALLOWED_HOSTS=["testserver"])
class FoundationTests(SimpleTestCase):
    def test_health_without_business_queries(self):
        response = self.client.get("/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["stage"], "api")

    def test_unknown_nonapi_route(self):
        self.assertEqual(self.client.get("/not-a-route/").status_code, 404)
