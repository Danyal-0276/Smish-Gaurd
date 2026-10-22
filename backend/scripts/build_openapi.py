"""Build a bounded, reviewable OpenAPI contract without importing private settings."""

import json
from pathlib import Path

text = lambda maximum: {"type": "string", "maxLength": maximum}
reference = lambda name: {"$ref": "#/components/schemas/" + name}


def obj(properties, required=None):
    return {
        "type": "object",
        "properties": properties,
        "required": required if required is not None else list(properties),
        "additionalProperties": False,
    }


schemas = {
    "Error": obj(
        {
            "error": obj(
                {
                    "code": text(60),
                    "message": text(300),
                    "request_id": {"type": "string", "format": "uuid"},
                }
            )
        }
    ),
    "Registration": obj(
        {
            "app_version": {**text(30), "pattern": "^[0-9A-Za-z._-]{1,30}$"},
            "consent_version": {"type": "string", "enum": ["2026-10-22", "2026-10-23"]},
            "cloud_analysis_consent": {"type": "boolean", "enum": [True]},
        }
    ),
    "Credential": obj(
        {
            "credential": {
                "type": "string",
                "description": "One-time installation bearer secret. Store only in Keystore-backed storage; never log.",
            },
            "expires_at": {"type": "string", "format": "date-time"},
            "installation_id": {"type": "string", "format": "uuid"},
        }
    ),
    "AnalysisInput": obj(
        {
            "text": {
                **text(5000),
                "minLength": 1,
                "description": "Non-whitespace JSON string. Body must also fit 32 KiB.",
            },
            "cloud_analysis_consent": {"type": "boolean", "enum": [True]},
        }
    ),
    "FeedbackInput": obj(
        {
            "client_event_id": {"type": "string", "format": "uuid"},
            "model_version": text(100),
            "risk": {"type": "string", "enum": ["low", "review", "high"]},
            "reason": {
                "type": "string",
                "enum": ["false_positive", "false_negative", "unclear"],
            },
            "feedback_consent": {"type": "boolean", "enum": [True]},
        }
    ),
    "Empty": obj({}),
}
common = {
    "request_id": {"type": "string", "format": "uuid"},
    "mode": {"type": "string", "enum": ["backend_model"]},
    "model_version": text(100),
    "coverage": text(2000),
    "safety_guarantee": {"type": "boolean", "enum": [False]},
}
schemas["CompletedAnalysis"] = obj(
    {
        **common,
        "status": {"type": "string", "enum": ["completed"]},
        "risk": {"type": "string", "enum": ["low", "review", "high"]},
        "policy_version": text(100),
        "model_estimate": {"type": "number", "minimum": 0, "maximum": 1},
        "indicators": {
            "type": "array",
            "maxItems": 20,
            "items": obj({"title": text(2000), "description": text(2000)}),
        },
        "domains": {"type": "array", "maxItems": 20, "items": text(253)},
        "advice": text(2000),
        "indicator_note": text(2000),
    }
)
schemas["UnsupportedAnalysis"] = obj(
    {
        **common,
        "status": {"type": "string", "enum": ["unsupported"]},
        "risk": {"type": "string", "nullable": True, "enum": [None]},
        "message": text(2000),
    }
)
schemas["AnalysisResponse"] = {
    "oneOf": [reference("CompletedAnalysis"), reference("UnsupportedAnalysis")],
    "discriminator": {
        "propertyName": "status",
        "mapping": {
            "completed": "#/components/schemas/CompletedAnalysis",
            "unsupported": "#/components/schemas/UnsupportedAnalysis",
        },
    },
}
schemas["Feedback"] = obj(
    {
        "id": {"type": "string", "format": "uuid"},
        "client_event_id": {"type": "string", "format": "uuid"},
        "model_version": text(100),
        "risk": {"type": "string", "enum": ["low", "review", "high"]},
        "reason": text(20),
        "status": {"type": "string", "enum": ["new", "reviewed"]},
        "created_at": {"type": "string", "format": "date-time"},
    }
)
schemas["FeedbackPage"] = obj(
    {
        "next": {"type": "string", "nullable": True},
        "previous": {"type": "string", "nullable": True},
        "results": {"type": "array", "maxItems": 20, "items": reference("Feedback")},
    }
)
schemas["Lesson"] = obj(
    {
        "slug": text(60),
        "title": text(120),
        "summary": text(300),
        "category": text(60),
        "duration": {"type": "integer"},
        "sections": {
            "type": "array",
            "maxItems": 20,
            "items": obj({"heading": text(2000), "body": text(2000)}),
        },
        "question": text(500),
        "options": {"type": "array", "maxItems": 6, "items": text(500)},
        "correct_index": {"type": "integer"},
        "explanation": text(2000),
        "revision": {"type": "integer"},
    }
)
schemas["Lessons"] = obj(
    {"results": {"type": "array", "maxItems": 50, "items": reference("Lesson")}}
)
schemas["Capabilities"] = obj(
    {
        "api_version": text(10),
        "consent_version": text(30),
        "max_characters": {"type": "integer"},
        "max_body_bytes": {"type": "integer"},
        "modes": {"type": "array", "items": text(30)},
        "coverage": text(2000),
        "stores_message_bodies": {"type": "boolean"},
        "automatic_sms": {"type": "boolean"},
        "android_client_sms_queue": {"type": "boolean"},
        "whatsapp_access": {"type": "boolean"},
    }
)
paths = {}


def operation(
    path, method, name, output=None, input=None, public=False, status="200", parameters=None
):
    responses = {status: {"description": "Success"}}
    if output:
        responses[status]["content"] = {"application/json": {"schema": reference(output)}}
    for code in ["400", "401", "403", "404", "413", "415", "429", "503"]:
        responses[code] = {
            "description": "Controlled error; no payload or secret echo",
            "content": {"application/json": {"schema": reference("Error")}},
        }
    op = {
        "operationId": name,
        "security": [] if public else [{"InstallationBearer": []}],
        "responses": responses,
    }
    if input:
        op["requestBody"] = {
            "required": True,
            "content": {"application/json": {"schema": reference(input)}},
        }
    if parameters:
        op["parameters"] = parameters
    paths.setdefault(path, {})[method] = op


operation(
    "/api/v1/installations",
    "post",
    "registerInstallation",
    "Credential",
    "Registration",
    public=True,
    status="201",
)
operation("/api/v1/installations/me", "delete", "revokeInstallation", status="204")
operation(
    "/api/v1/installations/me/credentials/rotate",
    "post",
    "rotateCredential",
    "Credential",
    "Empty",
)
operation("/api/v1/analyses", "post", "analyzeText", "AnalysisResponse", "AnalysisInput")
operation("/api/v1/capabilities", "get", "readCapabilities", "Capabilities", public=True)
operation(
    "/api/v1/feedback/me",
    "post",
    "submitMetadataFeedback",
    "Feedback",
    "FeedbackInput",
    status="201",
)
paths["/api/v1/feedback/me"]["post"]["responses"]["200"] = {
    "description": "Idempotent replay of the same event",
    "content": {"application/json": {"schema": reference("Feedback")}},
}
operation(
    "/api/v1/feedback/me",
    "get",
    "readOwnFeedback",
    "FeedbackPage",
    parameters=[{"name": "cursor", "in": "query", "schema": {"type": "string"}}],
)
operation(
    "/api/v1/feedback/me/{identifier}",
    "delete",
    "deleteOwnFeedback",
    status="204",
    parameters=[
        {
            "name": "identifier",
            "in": "path",
            "required": True,
            "schema": {"type": "string", "format": "uuid"},
        }
    ],
)
operation("/api/v1/lessons", "get", "readPublishedLessons", "Lessons", public=True)
operation(
    "/api/v1/lessons/{slug}",
    "get",
    "readPublishedLesson",
    "Lesson",
    public=True,
    parameters=[{"name": "slug", "in": "path", "required": True, "schema": text(60)}],
)
spec = {
    "openapi": "3.0.3",
    "info": {
        "title": "SmishGuard API",
        "version": "1.0.0",
        "description": "Metadata-only installation service and transient SMS-model inference. No cloud SMS inbox. Staff operations use separate Django Admin sessions/CSRF.",
    },
    "paths": paths,
    "components": {
        "securitySchemes": {
            "InstallationBearer": {
                "type": "http",
                "scheme": "bearer",
                "description": "Per-installation opaque credential; not a human account or a JWT.",
            }
        },
        "schemas": schemas,
    },
}
target = Path(__file__).resolve().parents[1] / "openapi.json"
target.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
print("OpenAPI contract written without private configuration.")
