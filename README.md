# ReaderXP (In Alpha)

ReaderXP is a browser extension designed to improve reading engagement through gamification. Instead of passively scrolling through online content, users earn experience points, coins, and virtual pet rewards as they read articles and complete reading sessions.

## Overview

Many people struggle to stay focused while reading online due to distractions, information overload, and reduced motivation. ReaderXP addresses this problem by combining article extraction, reading progress tracking, virtual pets, rewards, and session analytics into a single reading experience.
The extension transforms web articles into a distraction-reduced reading environment while encouraging users to build consistent reading habits through progression systems and interactive feedback.

<img width="311" height="388" alt="Screenshot 2026-11-11 155737" src="https://github.com/user-attachments/assets/a17e3ce0-5a68-4a74-84d4-53f2bd533a92" />
<img width="613" height="323" alt="Screenshot 2026-11-12 091711" src="https://github.com/user-attachments/assets/0a95cddd-702c-4d45-a35d-625603c411e8" />
<br>
<img width="338" height="350" alt="Screenshot 2026-11-10 212014" src="https://github.com/user-attachments/assets/9b78ebf8-4d0a-43a1-a66e-72516e9a3d50" />
<img width="324" height="364" alt="Screenshot 2026-11-10 212655" src="https://github.com/user-attachments/assets/62064c3b-999e-4022-988c-ee4efb4535b0" />
<br>
<img width="358" height="499" alt="Screenshot 2026-11-12 091414" src="https://github.com/user-attachments/assets/fa4c2fa0-f5ad-4d55-8df5-132c0dc5cde6" />
<img width="326" height="501" alt="Screenshot 2026-11-10 212146" src="https://github.com/user-attachments/assets/e44f57b1-8c5a-497f-82d3-590e43a9e3e2" />



### Key Features
#### Reading Interface

- Extracts article content using Mozilla Readability
- Presents content in a clean, paginated reader
- Tracks reading progress in real time
- Supports pause and resume functionality
- Saves reading sessions automatically

#### Progression System

- Experience points (XP) earned from reading
- Reader leveling system
- Coin rewards based on reading activity
- Session completion statistics
- Lifetime reading analytics

#### Virtual Pet System

- Interactive companion pet
- Mood, hunger, hygiene, social, and energy statistics
- Dynamic animations and activities
- Reading rewards improve pet wellbeing
- Care and maintenance mechanics

##### Shop & Inventory

- Earn and spend coins
- Purchase consumable items
- Inventory management system
- Item effects that influence pet attributes

#### Session Tracking

- Words read
- Reading time
- Completion percentage
- XP earned
- Coins earned
- Historical reading sessions

### System Architecture
Web Page -> Content Script -> Text Extraction (Readability) -> Sentence Processing & Pagination -> Reader UI -> Progress Tracking & Rewards -> Pet / Shop / Inventory Systems -> Storage & Session Persistence -> ReaderXP Popup Interface

### Technologies Used

- JavaScript (ES6 Modules)
- HTML5
- CSS3
- Chrome Extension APIs
- Mozilla Readability
- Chrome Storage API

### Usage 

1. Open an article webpage.
2. Launch ReaderXP from the browser toolbar.
3. Start a reading session.
4. Read through the generated pages.
5. Earn XP and coins as progress is made.
6. Spend coins in the shop and care for the virtual pet.
7. View completed sessions and lifetime statistics through the popup interface

### Future Improvements

- Attention check and engagement validation features
- Topic and tag-based session organization
- Integrated note-taking and annotation tools
- Companion web application with synchronized data
- Additional virtual pets and pet content
- Expanded reader customization options
- Automatic Text Extraction from PDFs and Images

---

## Privacy Policy

Last Updated: November 2026

### Information We Access

ReaderXP may access webpage titles, URLs, and webpage content necessary to provide its reader-mode functionality.

### How Information Is Used

The accessed information is used solely to provide reading, accessibility, personalization, and gamification features.

### Data Storage

ReaderXP stores user preferences, reading statistics, and reading session information locally using Chrome storage APIs.

### Data Sharing

ReaderXP does not sell, share, rent, or transfer user data to third parties.

### Remote Transmission

ReaderXP does not transmit webpage content, browsing history, or personal information to external servers.