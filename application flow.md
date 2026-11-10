# Application ka Flow

SMMA backend mein request, agents, social posts aur schedule kiye gaye jobs ka flow:

## Diagram (seedha nazar aane wala)

```text
 Clients / Social Platforms
            |
            v
   Express API (src/app.ts) <------------------- Cron (har 60 second)
            |                                             |
   Tenant context middleware                              v
            |                                   Waqt par tay posts dhoondo
     +------+------+------+                                |
     |             |      |                                v
     v             v      v                       Social platform par bhejo
 Agent APIs    Post API  Webhooks                         |
     |             |      |                                v
     |             |      +--> Foran 200 OK jawab         PUBLISHED / FAILED mark karo
     |             |             |                         |
     |             |             +--> Agent Engine         +--> 60 second baad:
     |             |                       |                    self-comment agent chalao
     |             |                       v
     |             |             Bana hua jawab log hota hai
     |             |             (customer ko nahi bheja jata)
     |             |
     |             +--> POST_DISTRIBUTION agent
     |                       |
     |                Har platform ke liye post tayyar karo
     |                       |
     |              Kya peak time par schedule karna hai?
     |                 /           \
     |               Haan           Nahi
     |                |              |
     |         PENDING post save  IMMEDIATE ke taur par jawab
     |         karo PostgreSQL mein (yahan se bheja nahi jata)
     |                |
     |                +-------> Waqt aane par Cron post uthata hai
     |
     +--> Chat / Direct agent ki request
                  |
                  v
             Agent Engine
        Input aur tenant info tayyar karo
                  |
             Supervisor agent
                  |
       +----------+-----------+----------------------+
       |          |           |                      |
       v          v           v                      v
    DM handler  Support    Content, research    Analytics /
                / closer  aur comment agents   engagement agents
       |          |           |                      |
       +----------+-----------+----------------------+
                              |
                              v
                 Jawab + chalne ke steps ka record
                    /                  \
          Caller ko jawab do      Kya contact details mili?
                                        |
                                  Lead database mein save karo
                                  + Google Sheets se sync

 GET /api/v1/agents/leads ----------------> Tenant ke leads PostgreSQL se lao
 GET /health ----------------------------> Health status ka jawab
```

## Tafseeli Mermaid diagram

```mermaid
flowchart TD
    Start["src/index.ts<br/>Env load karo aur HTTP server chalao"] --> CronStart["Autonomous cron chalao<br/>Har 60 second"]
    Start --> App["Express app<br/>JSON / URL-encoded body parho"]
    App --> Tenant["Tenant context middleware<br/>x-tenant-id UUID ho to validate karo"]

    Tenant --> Health{"GET /health request hai?"}
    Health -- Haan --> HealthResponse["Status, waqt aur uptime wapas karo"]
    Health -- Nahi --> Routes{"Kaunsa route hai?"}

    Routes --> ChatRoute["POST /api/v1/agents/chat"]
    Routes --> DirectRoute["POST /api/v1/agents/direct/:agentName"]
    Routes --> LeadsRoute["GET /api/v1/agents/leads"]
    Routes --> PublishRoute["POST /api/v1/posts/publish"]
    Routes --> MetaWebhook["/webhooks/meta"]
    Routes --> WhatsAppWebhook["/webhooks/whatsapp"]

    ChatRoute --> ChatValidate["Zod se chat payload validate karo"]
    ChatValidate -->|Ghalat| BadRequest["400: Request durust nahi"]
    ChatValidate -->|Durust| ChatInvoke["Tenant context chuno<br/>Agent engine chalao"]

    DirectRoute --> DirectValidate["Message ya prompt lazmi hai<br/>Agent alias pehchano"]
    DirectValidate -->|Message nahi hai| BadRequest
    DirectValidate --> DirectInvoke["Mangay gaye agent ke saath<br/>agent engine chalao"]

    ChatInvoke --> Normalize
    DirectInvoke --> Normalize
    PublishInvoke --> Normalize
    MetaInvoke --> Normalize
    WhatsAppInvoke --> Normalize

    subgraph AgentEngine["LangGraph agent engine"]
        Normalize["Input tayyar karo<br/>Zarurat par tenant calendar integration lao"]
        Supervisor["Supervisor node<br/>Agent pehle se chuna ho to routing LLM skip"]
        ChooseAgent{"Munaseb specialized agent chuno"}
        Dm["DM handler"]
        Closer["Inbox support / closer"]
        SelfComment["Self-comment"]
        Trend["Trend planner"]
        Publisher["Post formatter"]
        Research["Competitor research"]
        CommentReply["Comment ka jawab"]
        Analytics["Analytics"]
        Competitor["Competitor engagement"]
        AgentResult["Aakhri natija do<br/>jawab, lead data, trace aur review flags"]

        Normalize --> Supervisor --> ChooseAgent
        ChooseAgent --> Dm
        ChooseAgent --> Closer
        ChooseAgent --> SelfComment
        ChooseAgent --> Trend
        ChooseAgent --> Publisher
        ChooseAgent --> Research
        ChooseAgent --> CommentReply
        ChooseAgent --> Analytics
        ChooseAgent --> Competitor
        Dm --> AgentResult
        Closer --> AgentResult
        SelfComment --> AgentResult
        Trend --> AgentResult
        Publisher --> AgentResult
        Research --> AgentResult
        CommentReply --> AgentResult
        Analytics --> AgentResult
        Competitor --> AgentResult
    end

    AgentResult --> CallerOutput{"Natija kis flow ko wapas dena hai?"}
    CallerOutput --> ChatResult["Chat API: jawab, intent, lead score,<br/>CRM updates, review flag aur execution trace do"]
    CallerOutput --> DirectResult["Direct API: agent ka jawab aur execution trace do"]
    CallerOutput --> WebhookLog["Webhook: bana hua jawab log karo<br/>(customer ko wapas nahi bhejta)"]
    CallerOutput --> FormatPost["Post API: bana hua content istemal karo"]
    ChatResult --> HasContact{"CRM contact updates mile?"}
    HasContact -->|Haan| SaveLead["Lead PostgreSQL mein save karo<br/>Phir Google Sheets se async sync"]
    HasContact -->|Nahi| NoLead["Lead save nahi hoga"]

    LeadsRoute --> FetchLeads["PostgreSQL se tenant ke 50 tak leads lao"]
    FetchLeads --> LeadsResult["Leads aur unki tadaad wapas karo"]

    PublishRoute --> PostValidate["Topic, platforms aur options validate karo"]
    PostValidate -->|Ghalat| BadPost["400: Post payload durust nahi"]
    PostValidate -->|Durust| EachPlatform["Har chune hue platform ke liye"]
    EachPlatform --> PublishInvoke["POST_DISTRIBUTION agent chalao"]
    FormatPost --> AutoSchedule{"autoSchedulePeak on hai?"}
    AutoSchedule -->|Haan| PickSlot["Platform ka agla peak slot chuno"]
    PickSlot --> InsertPost["PENDING post PostgreSQL mein save karo"]
    InsertPost --> ScheduledResult["Content, schedule ka waqt aur job ID shamil karo"]
    AutoSchedule -->|Nahi| ImmediateResult["Formatted content IMMEDIATE ke taur par do<br/>(is route se post nahi bheji jati)"]
    ScheduledResult --> PostResponse["Tamam platforms ka natija wapas karo"]
    ImmediateResult --> PostResponse

    CronStart --> CronTick["Har 60 second mein due PENDING posts dhoondo"]
    CronTick --> DuePosts{"Koi post publish ke liye tayyar hai?"}
    DuePosts -->|Nahi| WaitTick["Agli tick ka intezar karo"]
    WaitTick --> CronTick
    DuePosts -->|Haan| Dispatch["Platform ke mutabiq bhejo<br/>Meta, WhatsApp, LinkedIn ya X"]
    Dispatch --> DispatchOk{"Post bheji gayi?"}
    DispatchOk -->|Haan| MarkPublished["Post ko PUBLISHED mark karo"]
    DispatchOk -->|Nahi| MarkFailed["Post ko FAILED mark karo"]
    MarkPublished --> Delay["60 second intezar karo"]
    Delay --> CommentAgent["SELF_COMMENTER agent chalao"]
    CommentAgent --> CommentNote["Bana hua comment log hota hai<br/>(comment post karna abhi wired nahi hai)"]
    MarkFailed --> WaitTick
    CommentNote --> WaitTick

    MetaWebhook --> MetaVerify{"GET verification request?"}
    MetaVerify -->|Haan, token durust hai| VerifyOk["Challenge wapas karo"]
    MetaVerify -->|Nahi / token ghalat hai| Forbidden["403: Ijazat nahi"]
    MetaVerify -->|POST event| MetaAck["Foran 200 OK jawab do"]
    MetaAck --> MetaFilter["Instagram ya Facebook ke text messages lo<br/>Echo aur khali messages nazarandaz karo"]
    MetaFilter -->|Durust message| MetaInvoke["Social channel ke saath agent engine chalao"]

    WhatsAppWebhook --> WhatsAppVerify{"GET verification request?"}
    WhatsAppVerify -->|Haan, token durust hai| VerifyOk
    WhatsAppVerify -->|Nahi / token ghalat hai| Forbidden
    WhatsAppVerify -->|POST event| WhatsAppAck["Foran 200 OK jawab do"]
    WhatsAppAck --> WhatsAppFilter["Aane wale text messages lo"]
    WhatsAppFilter -->|Durust message| WhatsAppInvoke["WhatsApp channel ke saath agent engine chalao"]
```

## Aham hisson ki wazahat

- **Agent ka jawab:** Khaas nodes Qwen/Groq JSON client ko call karte hain. Support/closer node tenant ke knowledge base se bhi maloomat leta hai.
- **Tenant ka data:** PostgreSQL mein leads aur schedule ki hui posts save hoti hain. Lead data Google Sheets se bhi sync ho sakta hai.
- **Social posts bhejna:** Schedule ki hui posts, platform credentials ke zariye social dispatcher bhejta hai.
- **Webhook ke jawab:** Meta aur WhatsApp webhooks agent ka jawab banate hain, lekin filhal sirf record karte hain; customer ko DM bhejna in handlers mein wired nahi hai.
- **Band karna:** `SIGTERM` ya `SIGINT` par cron timer rukta hai aur HTTP server araam se band hota hai.
- **Ghalatiyan:** Ghalat payload par `400`, route fail hone par `500` milta hai; Express error handler baqi ghalatiyan record karta hai.
