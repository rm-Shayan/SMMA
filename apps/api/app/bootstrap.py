from .core import registry
from .modules.campaigns import InboxResponderAgent, OutreachAgent
from .modules.knowledge import CompanyOpsAgent, TraineeSopAgent
from .modules.orchestration import (
    AnalyticsAgent,
    CompetitorResearcherAgent,
    CopilotAgent,
    DailyBriefAgent,
    SupervisorAgent,
)
from .modules.social import (
    CommentResponderAgent,
    CompetitorEngagerAgent,
    OwnPostEngagerAgent,
    PublisherAgent,
)


def register_all() -> None:
    if registry.codes():
        return
    for agent in (
        OwnPostEngagerAgent(),
        CompetitorResearcherAgent(),
        CommentResponderAgent(),
        AnalyticsAgent(),
        DailyBriefAgent(),
        OutreachAgent(),
        CompetitorEngagerAgent(),
        PublisherAgent(),
        InboxResponderAgent(),
        TraineeSopAgent(),
        CompanyOpsAgent(),
        SupervisorAgent(),
        CopilotAgent(),
    ):
        registry.register(agent)
