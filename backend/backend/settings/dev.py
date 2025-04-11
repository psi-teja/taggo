from .base import *

DEBUG = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "taggo",
        "USER": "postgres",
        "PASSWORD": "pravesh123",
        "HOST": "tally-ai-doc-ai-taggo-database.c1scke6e0waa.ap-south-1.rds.amazonaws.com",
        "PORT": "5432",  # Set to '3306' by default for MySQL
    }
}

S3_DOC_BUCKET = "tally-ai-doc-ai-taggo-documents"
S3_PRE_LABEL_BUCKET = "tally-ai-doc-ai-taggo-pre-labels"
S3_LABELLING_BUCKET = "tally-ai-doc-ai-taggo-labelling"
S3_LABEL_BUCKET = "tally-ai-doc-ai-taggo-labels"

S3_DOC_BUCKET_SEG = "tally-ai-doc-ai-taggo-segregation-documents"
S3_SEGREGATED_BUCKET = "tally-ai-doc-ai-taggo-segregated-documents"
