# CareBridge AI - 7-Minute Presentation Script

## [Slide 1: Title] (30 seconds)

**"Good morning. I'm here to present CareBridge AI — a solution that prevents patients from falling through the cracks in rural healthcare."**

**"In January 2026, Clearwater Ridge — a remote northern Canadian community of 1,800 residents — experienced a severe winter storm that closed their only highway for five days. During this crisis, an elderly resident with a heart condition missed a cardiology follow-up. The appointment was never rebooked. Two weeks later, that resident was airlifted to the hospital following an avoidable medical emergency."**

**"This wasn't just a weather problem. It was a coordination problem. And that's what we're solving today."**

---

## [Slide 2: The Problem] (1 minute)

**"Clearwater Ridge faces three critical breakdowns in care coordination."**

**"First: Missed appointments go untracked. Referrals are managed through phone calls, paper forms, and spreadsheets. When appointments are missed — whether due to weather, transportation issues, or communication gaps — there's no systematic way to track or reschedule them."**

**"Second: Information is fragmented. Healthcare providers, patients, and community support services operate in silos. A nurse at the local station doesn't know if a patient attended their specialist appointment 110 kilometers away."**

**"Third: Warning signs appear too late. Without continuous tracking, preventable emergencies escalate. That cardiology incident cost $15,000 in airlift expenses alone — and more importantly, it endangered a life."**

**"The current system lacks the flexibility to respond to disasters, coordinate care, or prevent avoidable escalations."**

---

## [Slide 3: Our Solution - CareBridge AI] (1.5 minutes)

**"CareBridge AI is a hybrid AI and human care platform that turns scattered healthcare moments into one continuous care journey."**

**"For patients, CareBridge provides an AI-powered healthcare companion. Patients can describe symptoms, ask questions, and receive guidance — especially when travel is impossible. The AI understands each patient's history and responds in context. If something seems serious, it immediately involves a real nurse or doctor."**

**"For providers, CareBridge creates an automated patient timeline. Every interaction — appointments, symptoms, missed visits, referrals, AI conversations, and risk alerts — automatically becomes part of a living timeline. Instead of scattered notes, doctors see one clear story of the patient. Nothing gets lost."**

**"The platform also includes explainable decision logic. When the system raises concern, it shows why — making decisions transparent and trustworthy for both patients and providers."**

**"And finally, CareBridge provides smart follow-ups and reminders. It automatically flags missed visits, creates follow-up tasks, and prompts rescheduling. If something isn't completed, it escalates instead of disappearing."**

---

## [Slide 4: How It Works - Technical Overview] (1.5 minutes)

**"Let me walk you through how CareBridge works in practice."**

**"When a patient opens CareBridge, they see their health timeline and can chat with our AI companion. The AI uses Cohere's language model to understand context, assess risk, and provide guidance. If a patient mentions symptoms like 'chest tightness' or 'shortness of breath,' the system automatically extracts this information and creates a timeline event."**

**"Behind the scenes, our system continuously monitors conversations for high-risk keywords. When detected, it immediately creates alerts for healthcare providers and updates the patient's risk level."**

**"For providers, the dashboard shows all patients sorted by risk level. Clicking a patient reveals their complete timeline — every symptom, appointment, and interaction. Providers can see the decision graph that explains why a patient is flagged as high-risk."**

**"The system also generates conversation summaries after each AI interaction, automatically adding them to the patient timeline. This ensures providers have full context before seeing a patient."**

**"Our prototype is built with FastAPI on the backend, React and TypeScript on the frontend, and uses Supabase for data storage. The AI integration uses Cohere for natural language understanding and ElevenLabs for text-to-speech, creating a conversational experience."**

---

## [Slide 5: Target Consumers & Market] (1 minute)

**"Our primary consumers are rural healthcare communities like Clearwater Ridge — remote communities with limited healthcare infrastructure, high proportions of seniors, and challenges with transportation and specialist access."**

**"Within these communities, we serve three key user groups:"**

**"First: Patients — especially those with chronic conditions, seniors, and individuals requiring regular specialist follow-ups. These patients need continuous support and clear communication about their care."**

**"Second: Healthcare providers — nurses at local stations, rotating family physicians, and care coordinators. These providers need visibility into patient status and tools to prevent care gaps."**

**"Third: Community health councils and administrators — organizations responsible for coordinating care and managing limited healthcare budgets."**

**"The market opportunity is significant. Virtual care now accounts for 33% of all healthcare visits in Canada, and this trend is especially critical for rural regions where travel is expensive, unreliable, or seasonally unsafe."**

---

## [Slide 6: Feasibility & Scalability] (1 minute)

**"CareBridge is designed for immediate feasibility and long-term scalability."**

**"From a technical standpoint, our solution uses modern, cloud-based architecture that can scale from a single community to multiple regions. The AI integration is production-ready, using established APIs from Cohere and ElevenLabs."**

**"From an implementation standpoint, CareBridge requires minimal hardware — just tablets or smartphones that most communities already have. The platform is web-based, so there's no complex installation process."**

**"From a user adoption standpoint, we've designed the interface to be intuitive and low-friction. Patients interact through natural conversation, and providers see familiar timeline and dashboard views."**

**"The system is also designed to integrate with existing healthcare infrastructure. It can work alongside current referral systems, appointment scheduling, and communication methods — enhancing rather than replacing what's already in place."**

**"For scalability, the platform can expand from Clearwater Ridge's 1,800 residents to serve multiple communities, with centralized AI infrastructure and community-specific patient data."**

---

## [Slide 7: Financials & ROI] (1 minute)

**"Let's talk about the financials."**

**"The Clearwater Ridge Community Health Council has allocated $60,000 CAD for first-year development and deployment, with ongoing costs capped at $25,000 per year."**

**"Our budget allocation:"**

**"Software development: $35,000 — covering our full-stack development, AI integration, and initial deployment."**

**"Cloud hosting and maintenance: $20,000 per year — covering Supabase database, API costs for Cohere and ElevenLabs, and ongoing infrastructure."**

**"Hardware: $5,000 — for tablets and devices for the nursing station and key community access points."**

**"Now, let's look at the return on investment."**

**"Missed appointments cost approximately $200 each. Preventable emergency hospitalizations cost $8,000 to $12,000. Emergency airlifts cost $15,000 per incident."**

**"If CareBridge prevents just one avoidable emergency hospitalization per year, it pays for itself. If it prevents one airlift, it saves $15,000 — more than half the annual operating budget."**

**"But the real value is in prevention. By tracking missed appointments, flagging high-risk patients, and ensuring follow-up continuity, CareBridge prevents small problems from becoming expensive emergencies."**

**"For a community like Clearwater Ridge, reducing preventable emergencies by even 10% would save tens of thousands of dollars annually — far exceeding the platform's operating costs."**

---

## [Slide 8: Impact & Conclusion] (30 seconds)

**"CareBridge AI doesn't replace doctors. It prevents patients from falling through the cracks."**

**"By automating care timelines, providing AI-guided support, and ensuring nothing gets lost, CareBridge transforms scattered healthcare moments into one continuous care journey."**

**"For Clearwater Ridge, this means:"**

**"Fewer missed appointments and better care continuity."**

**"Earlier detection of warning signs before they become emergencies."**

**"Reduced costs from preventable hospitalizations and airlifts."**

**"And most importantly, better health outcomes for residents — even when highways are closed and travel is impossible."**

**"Thank you. I'm happy to answer any questions."**

---

## Timing Breakdown:
- **Introduction & Problem**: 1.5 minutes
- **Solution Overview**: 1.5 minutes
- **How It Works**: 1.5 minutes
- **Target Consumers**: 1 minute
- **Feasibility**: 1 minute
- **Financials**: 1 minute
- **Conclusion**: 30 seconds
- **Total**: ~7 minutes

## Key Points to Emphasize:
1. **Real problem**: The cardiology incident shows tangible consequences
2. **Practical solution**: Works with existing infrastructure, not a complete replacement
3. **Clear ROI**: Financial benefits are measurable and significant
4. **Scalable**: Can grow from one community to many
5. **Feasible**: Uses proven technology, minimal hardware requirements
