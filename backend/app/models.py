from pydantic import BaseModel
from typing import List, Optional

class ExplainRequest(BaseModel):
    code_snippet: str
    file_path: str
    line_numbers: str

class ExplainResponse(BaseModel):
    markdown: str

class ContextObject(BaseModel):
    source: str # "slack" or "jira"
    title_or_user: str
    url: Optional[str] = None
    content_summary: str
    relevance_score: float = 0.0
    related_code_files: List[str] = []

class StatsRequest(BaseModel):
    snippets: List[str]

class StatsObject(BaseModel):
    slack_count: int
    jira_count: int
    open_jira_count: int

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
