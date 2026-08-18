-- ============================================================
-- 20 complete mock job positions + clear stale (retired-flow) notifications
-- Run once in the Supabase SQL editor.
-- ============================================================

-- 1) Remove leftover endorsement/approval notifications (that flow was retired)
delete from public.notifications where kind in ('endorsed','approved','rejected');

-- 2) Insert 20 fully-described open positions
insert into public.jobs (role, client, location, salary_range, openings, priority, status, employment_type, department, industry, working_schedule, description, about, responsibilities, must_have, nice_to_have, we_offer, expected_skills) values
('Merchandiser', 'SONY', 'Makati', '17000-20000', 6, 'high', 'open', 'Full-time', 'Field Operations', 'Retail & FMCG', 'Full-time, shifting', 'Ensure Sony products are always well-stocked, correctly priced, and attractively displayed across assigned retail outlets to drive sell-out and brand visibility..', 'Ensure Sony products are always well-stocked, correctly priced, and attractively displayed across assigned retail outlets to drive sell-out and brand visibility.', 'Maintain product displays, shelves and planograms to brand standards
Monitor stock levels and coordinate replenishment with store staff
Set up promotional materials and verify pricing accuracy
Track competitor activity and submit daily field reports
Build strong working relationships with store personnel', 'At least high school / senior high school graduate
Willing to do daily fieldwork and stand for long hours
Keen eye for detail and well-organized
Willing to be assigned in Makati and nearby areas', 'Experience in merchandising or retail
Basic knowledge of consumer electronics', 'Competitive salary with allowances
SSS, PhilHealth, Pag-IBIG & HDMF coverage
13th month pay and government-mandated benefits
Paid training and product orientation
Opportunities for regularization and promotion', 'Merchandising, Retail, Inventory, POS, Attention to Detail'),
('Sales Promoter', 'HAIER', 'Quezon City', '15000-18000', 8, 'urgent', 'open', 'Full-time', 'Sales', 'Retail & FMCG', 'Full-time, shifting', 'Actively promote and sell Haier appliances to shoppers, hit sales targets, and deliver a memorable in-store experience..', 'Actively promote and sell Haier appliances to shoppers, hit sales targets, and deliver a memorable in-store experience.', 'Approach and engage customers to promote products
Achieve daily and monthly sales quotas
Explain product features, benefits and promos
Keep the selling area clean, stocked and presentable
Report daily sales and inventory movement', 'At least high school / senior high school graduate
Confident, energetic and customer-oriented
Willing to work retail hours, weekends and holidays
Willing to be assigned in Quezon City', 'Retail selling or promoter experience
Experience with home appliances', 'Basic pay plus attractive sales incentives
Complete government-mandated benefits
13th month pay
Product and selling-skills training
Career growth within a leading brand', 'Sales, Customer Service, Product Demo, Communication, Persuasion'),
('Brand Ambassador', 'HISENSE', 'Cebu City', '16000-19000', 4, 'normal', 'open', 'Full-time', 'Brand Activation', 'Retail & FMCG', 'Full-time, shifting', 'Represent the Hisense brand with professionalism, drive product awareness, and create memorable experiences that build customer loyalty..', 'Represent the Hisense brand with professionalism, drive product awareness, and create memorable experiences that build customer loyalty.', 'Champion the brand image at retail and activation sites
Engage shoppers and communicate key brand messages
Support product launches, sampling and demos
Gather customer feedback and market insights
Ensure branding and merchandising standards are met', 'At least high school / senior high school graduate
Pleasing personality with strong communication skills
Presentable and comfortable engaging the public
Willing to be assigned in Cebu City', 'Experience as a brand ambassador or promoter
Background in events or activations', 'Basic pay plus attractive sales incentives
Complete government-mandated benefits
13th month pay
Product and selling-skills training
Career growth within a leading brand', 'Brand Promotion, Communication, Customer Engagement, Presentation'),
('Product Demonstrator', 'SKYWORTH', 'Davao City', '15000-17500', 5, 'high', 'open', 'Full-time', 'Sales', 'Retail & FMCG', 'Full-time, shifting', 'Demonstrate Skyworth TVs and appliances to shoppers, highlight key features, and convert interest into sales..', 'Demonstrate Skyworth TVs and appliances to shoppers, highlight key features, and convert interest into sales.', 'Conduct live product demonstrations in-store
Explain features, specifications and warranty
Assist customers in choosing the right product
Achieve assigned sales targets
Maintain demo units and displays', 'At least high school / senior high school graduate
Good communication and presentation skills
Willing to work on weekends and holidays
Willing to be assigned in Davao City', 'Experience demonstrating electronics or appliances', 'Basic pay plus attractive sales incentives
Complete government-mandated benefits
13th month pay
Product and selling-skills training
Career growth within a leading brand', 'Product Demo, Sales, Communication, Electronics, Customer Service'),
('Area Sales Supervisor', 'URC', 'Pampanga', '25000-30000', 2, 'urgent', 'open', 'Full-time', 'Sales', 'FMCG', 'Full-time', 'Oversee and coach a team of promoters and merchandisers across assigned outlets in the area, ensuring sales targets and standards are met..', 'Oversee and coach a team of promoters and merchandisers across assigned outlets in the area, ensuring sales targets and standards are met.', 'Supervise field teams across multiple retail outlets
Coach, train and motivate promoters and merchandisers
Monitor sales performance and implement action plans
Coordinate with clients and store management
Prepare and submit area sales reports', 'Bachelor''s degree in any business course
At least 2 years supervisory experience in FMCG or retail
With own motorcycle and valid driver''s license (an advantage)
Willing to travel within Pampanga and nearby areas', 'Experience handling promoters or merchandisers
Strong leadership and analytical skills', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Team Leadership, Sales Management, Coaching, Reporting, FMCG'),
('Store Supervisor', 'SONY', 'Cavite', '22000-26000', 2, 'high', 'open', 'Full-time', 'Retail Operations', 'Retail', 'Full-time, shifting', 'Lead day-to-day store operations, manage staff, and ensure excellent customer service and sales performance at the assigned Sony store..', 'Lead day-to-day store operations, manage staff, and ensure excellent customer service and sales performance at the assigned Sony store.', 'Manage daily store operations and staff schedules
Drive sales and achieve store targets
Ensure inventory accuracy and loss prevention
Uphold customer service and visual standards
Prepare sales and inventory reports', 'Bachelor''s degree, preferably business-related
At least 1 to 2 years retail supervisory experience
Willing to work retail hours and be assigned in Cavite', 'Experience in consumer electronics retail', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Store Operations, Team Leadership, Inventory, Customer Service, Sales'),
('Trade Marketing Specialist', 'URC', 'Makati', '28000-35000', 2, 'normal', 'open', 'Full-time', 'Marketing', 'FMCG', 'Full-time', 'Develop and execute trade marketing programs that grow brand presence and sell-out across retail channels..', 'Develop and execute trade marketing programs that grow brand presence and sell-out across retail channels.', 'Plan and implement in-store trade marketing activities
Coordinate promotions, displays and activations
Analyze sales data and market trends
Collaborate with sales and brand teams
Monitor budgets and measure program ROI', 'Bachelor''s degree in Marketing, Business or related field
At least 2 years trade or brand marketing experience in FMCG
Strong analytical and project management skills
Proficient in MS Excel and PowerPoint', 'Experience with modern trade accounts', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Trade Marketing, FMCG, Analytics, Project Management, MS Excel'),
('Field Sales Representative', 'HAIER', 'Bulacan', '18000-24000', 4, 'high', 'open', 'Full-time', 'Sales', 'Retail & FMCG', 'Full-time', 'Drive sales and distribution of Haier products across assigned territories by building strong dealer and retailer relationships..', 'Drive sales and distribution of Haier products across assigned territories by building strong dealer and retailer relationships.', 'Visit dealers and retailers to take orders and push sell-out
Achieve sales and distribution targets
Introduce new products and promotions
Monitor competitor activities
Submit daily coverage and sales reports', 'At least college level; graduate an advantage
With own motorcycle and valid driver''s license
At least 1 year field sales experience preferred
Willing to travel within Bulacan', 'Experience selling appliances or FMCG', 'Basic pay plus attractive sales incentives
Complete government-mandated benefits
13th month pay
Product and selling-skills training
Career growth within a leading brand', 'Field Sales, Distribution, Negotiation, Territory Management, Driving'),
('In-Store Activator', 'HISENSE', 'Iloilo City', '14000-16000', 3, 'normal', 'open', 'Full-time', 'Brand Activation', 'Retail & FMCG', 'Full-time, shifting', 'Energize the sales floor through product activations, sampling, and engaging customer interactions that boost brand trial and sales..', 'Energize the sales floor through product activations, sampling, and engaging customer interactions that boost brand trial and sales.', 'Run in-store activations and product trials
Engage shoppers and drive product interest
Distribute flyers and promotional items
Report activation results and customer feedback
Maintain activation setups and materials', 'At least high school / senior high school graduate
Energetic, outgoing and customer-focused
Willing to work weekends and holidays
Willing to be assigned in Iloilo City', 'Experience in events, activations or promotions', 'Basic pay plus attractive sales incentives
Complete government-mandated benefits
13th month pay
Product and selling-skills training
Career growth within a leading brand', 'Activation, Customer Engagement, Communication, Events, Sampling'),
('Warehouse Assistant', 'URC', 'Laguna', '15000-18000', 5, 'normal', 'open', 'Full-time', 'Logistics', 'FMCG', 'Full-time, shifting', 'Support warehouse operations by receiving, storing, and dispatching stocks accurately and safely..', 'Support warehouse operations by receiving, storing, and dispatching stocks accurately and safely.', 'Receive, check and store incoming stocks
Pick, pack and prepare items for dispatch
Maintain accurate inventory records
Keep the warehouse clean and organized
Assist in periodic inventory counts', 'At least high school / senior high school graduate
Physically fit and able to lift heavy items
Willing to work in shifts and be assigned in Laguna
Attention to detail', 'Warehouse or stockroom experience
Forklift certification an advantage', 'Competitive salary with allowances
SSS, PhilHealth, Pag-IBIG & HDMF coverage
13th month pay and government-mandated benefits
Paid training and product orientation
Opportunities for regularization and promotion', 'Warehousing, Inventory, Logistics, Forklift, Attention to Detail'),
('Delivery Driver', 'UNCLE JOHNS', 'Mandaluyong', '16000-19000', 4, 'high', 'open', 'Full-time', 'Logistics', 'Food & Beverage', 'Full-time, shifting', 'Deliver products safely and on time to stores and customers while providing excellent service..', 'Deliver products safely and on time to stores and customers while providing excellent service.', 'Deliver goods to assigned routes on schedule
Load and unload items and verify quantities
Ensure vehicle cleanliness and basic maintenance
Collect payments or documents when required
Follow traffic rules and safety standards', 'At least high school graduate
Valid professional driver''s license (restriction 1, 2 and 3)
At least 1 year driving or delivery experience
Familiar with Metro Manila routes', 'Experience in food or FMCG delivery', 'Competitive salary with allowances
SSS, PhilHealth, Pag-IBIG & HDMF coverage
13th month pay and government-mandated benefits
Paid training and product orientation
Opportunities for regularization and promotion', 'Driving, Delivery, Route Planning, Customer Service, Safety'),
('Cashier', 'UNCLE JOHNS', 'Manila', '14000-16000', 6, 'normal', 'open', 'Full-time', 'Retail Operations', 'Food & Beverage', 'Full-time, shifting', 'Handle cash and card transactions accurately while giving fast, friendly service to every customer..', 'Handle cash and card transactions accurately while giving fast, friendly service to every customer.', 'Process sales transactions via POS accurately
Handle cash, card and e-wallet payments
Issue receipts and manage change
Balance the cash drawer at end of shift
Assist customers with inquiries', 'At least high school / senior high school graduate
Honest, trustworthy and detail-oriented
Basic math and POS skills
Willing to work shifts, weekends and holidays', 'Cashiering or retail experience', 'Competitive salary with allowances
SSS, PhilHealth, Pag-IBIG & HDMF coverage
13th month pay and government-mandated benefits
Paid training and product orientation
Opportunities for regularization and promotion', 'Cashiering, POS, Cash Handling, Customer Service, Math'),
('Customer Service Representative', 'SONY', 'Taguig', '18000-22000', 4, 'high', 'open', 'Full-time', 'Customer Service', 'Retail', 'Full-time, shifting', 'Provide excellent after-sales support and resolve customer concerns to build lasting brand loyalty..', 'Provide excellent after-sales support and resolve customer concerns to build lasting brand loyalty.', 'Attend to customer inquiries via phone, email and chat
Process service requests, returns and warranties
Coordinate with technical and logistics teams
Maintain accurate customer records
Meet service quality and resolution targets', 'At least college level; graduate preferred
Good English and Filipino communication skills
Customer-oriented and patient
Willing to be assigned in Taguig', 'Call center or customer service experience', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Customer Service, Communication, Problem Solving, CRM, After-Sales'),
('HR Assistant', 'CNT Promo & Ads Specialists, Inc.', 'Mandaluyong', '18000-22000', 2, 'normal', 'open', 'Full-time', 'Human Resources', 'Human Resources', 'Full-time', 'Support the HR team in recruitment, onboarding, timekeeping, and employee records to keep operations running smoothly..', 'Support the HR team in recruitment, onboarding, timekeeping, and employee records to keep operations running smoothly.', 'Assist in end-to-end recruitment and onboarding
Maintain 201 files and HR databases
Support timekeeping and payroll preparation
Coordinate employee engagement activities
Handle HR documentation and reports', 'Bachelor''s degree in Psychology, HR or related field
Fresh graduates are welcome to apply
Organized, detail-oriented and trustworthy
Proficient in MS Office', 'Internship or experience in HR', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Recruitment, Onboarding, HRIS, MS Office, Documentation'),
('Recruitment Associate', 'CNT Promo & Ads Specialists, Inc.', 'Mandaluyong', '20000-25000', 3, 'urgent', 'open', 'Full-time', 'Recruitment', 'Human Resources', 'Full-time', 'Source, screen, and endorse qualified candidates to fill our clients'' manpower requirements quickly and accurately..', 'Source, screen, and endorse qualified candidates to fill our clients'' manpower requirements quickly and accurately.', 'Source candidates through job boards, social media and referrals
Screen resumes and conduct initial interviews
Schedule and coordinate client interviews
Maintain the applicant tracking system
Meet weekly hiring and deployment targets', 'Bachelor''s degree in Psychology, HR or related field
At least 1 year recruitment experience (volume hiring an advantage)
Strong sourcing and interviewing skills
Target-driven and organized', 'Experience in agency or field recruitment', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Sourcing, Interviewing, ATS, Volume Hiring, Coordination'),
('Accounting Staff', 'CNT Promo & Ads Specialists, Inc.', 'Mandaluyong', '20000-26000', 2, 'normal', 'open', 'Full-time', 'Finance', 'Accounting', 'Full-time', 'Handle day-to-day accounting tasks including billing, disbursements, and reconciliation to keep our finances accurate..', 'Handle day-to-day accounting tasks including billing, disbursements, and reconciliation to keep our finances accurate.', 'Prepare billings, vouchers and disbursements
Record and reconcile transactions
Assist in payroll and government remittances
Support monthly and annual closing
Maintain organized financial records', 'Bachelor''s degree in Accountancy or Financial Management
At least 1 year accounting experience
Knowledge of BIR and government compliance
Proficient in MS Excel and accounting systems', 'Experience with QuickBooks or SAP', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Accounting, Bookkeeping, Reconciliation, MS Excel, BIR Compliance'),
('IT Support Specialist', 'CNT Promo & Ads Specialists, Inc.', 'Mandaluyong', '25000-32000', 2, 'high', 'open', 'Full-time', 'Information Technology', 'Information Technology', 'Full-time', 'Keep our systems, hardware, and users running smoothly by providing reliable technical support and maintenance..', 'Keep our systems, hardware, and users running smoothly by providing reliable technical support and maintenance.', 'Provide desktop, network and application support
Set up and maintain hardware and software
Troubleshoot and resolve technical issues
Manage user accounts and access
Maintain IT inventory and documentation', 'Bachelor''s degree in IT, Computer Science or related field
At least 1 year IT support experience
Knowledge of Windows, networking and MS 365
Strong troubleshooting skills', 'Experience with helpdesk tools
Basic knowledge of cloud services', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'IT Support, Networking, Troubleshooting, Windows, MS 365'),
('Digital Marketing Specialist', 'CNT Promo & Ads Specialists, Inc.', 'Makati', '28000-35000', 2, 'normal', 'open', 'Full-time', 'Marketing', 'Marketing', 'Full-time', 'Plan and run digital campaigns across social, search, and email to grow our brand and generate quality leads..', 'Plan and run digital campaigns across social, search, and email to grow our brand and generate quality leads.', 'Create and manage social media and paid campaigns
Produce engaging content and creatives
Track analytics and optimize performance
Manage SEO and email marketing
Report on KPIs and campaign ROI', 'Bachelor''s degree in Marketing, Communications or related
At least 2 years digital marketing experience
Hands-on with Meta Ads, Google Ads and analytics
Strong copywriting and creative sense', 'Experience with Canva, CapCut or Adobe tools', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Digital Marketing, Social Media, SEO, Paid Ads, Analytics, Copywriting'),
('Event Coordinator', 'SKYWORTH', 'Pasig', '20000-25000', 2, 'high', 'open', 'Full-time', 'Brand Activation', 'Events', 'Full-time', 'Plan and execute product launches, mall activations, and roadshows that bring the Skyworth brand to life..', 'Plan and execute product launches, mall activations, and roadshows that bring the Skyworth brand to life.', 'Plan and coordinate events and activations end-to-end
Manage suppliers, logistics and manpower
Oversee event setup and on-site execution
Ensure brand standards and timelines are met
Prepare post-event reports', 'Bachelor''s degree in Marketing, Comms or related
At least 1 year events or activations experience
Strong organizational and coordination skills
Willing to work on-site and flexible hours', 'Network of event suppliers', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Event Planning, Coordination, Logistics, Vendor Management, Activation'),
('Inventory Analyst', 'URC', 'Batangas', '22000-28000', 2, 'normal', 'open', 'Full-time', 'Supply Chain', 'FMCG', 'Full-time', 'Analyze stock levels and movement to optimize inventory accuracy, availability, and cost across the supply chain..', 'Analyze stock levels and movement to optimize inventory accuracy, availability, and cost across the supply chain.', 'Monitor and analyze inventory levels and movement
Prepare inventory and stock-aging reports
Coordinate replenishment and stock transfers
Investigate and resolve stock discrepancies
Support demand and supply planning', 'Bachelor''s degree in Supply Chain, Industrial Engineering or Business
At least 1 year inventory or supply chain experience
Strong analytical and MS Excel skills
Detail-oriented and systematic', 'Experience with ERP or WMS systems', 'Competitive salary package
HMO upon regularization
Government-mandated benefits & 13th month pay
Learning and development programs
Supportive, professional work environment', 'Inventory Analysis, Supply Chain, MS Excel, Reporting, ERP');

select count(*) as total_open_jobs from public.jobs where status='open';
