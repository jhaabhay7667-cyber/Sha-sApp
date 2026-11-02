
# Sha'sapp — Design System and UI/UX Guidelines

**Project:** Sha'sapp  
**Document:** DESIGN.md  
**Product:** Full-Stack Messaging Application  
**Design Direction:** Modern, Minimal, Premium Messaging Experience  
**Primary Theme:** Midnight Navy and Electric Blue  
**Platforms:** Web and Android (Capacitor)  
**Status:** Development in Progress

---

# 1. Design Vision

Sha'sapp is designed to provide a clean, modern, comfortable, and personal messaging experience.

The interface should feel like a professional messaging product rather than a basic student project or generic dashboard.

The design must communicate:

- Simplicity
- Privacy
- Personal connections
- Reliability
- Modern technology
- Ease of communication

The primary design direction is a premium dark-blue interface with soft gradients, rounded surfaces, subtle borders, and carefully controlled animations.

The existing design is the foundation. Future improvements must preserve its identity and improve its consistency rather than replacing it unnecessarily.

## Design principles

1. Clean over complicated.
2. Consistency over decoration.
3. Readability over visual effects.
4. Useful interactions over unnecessary animations.
5. Mobile-first usability.
6. Accessible contrast and clear feedback.
7. Real application states instead of fake functionality.

---

# 2. Brand Identity

## Product name

Sha'sapp

## Brand presentation

The brand name should be displayed as:

**Sha's** + **app**

The word "Sha's" uses the normal foreground text color, while "app" uses the primary accent color.

## Brand icon

- Use the letter S inside a rounded square.
- Use a blue gradient background.
- Use white bold lettering.
- Keep the icon recognizable at small sizes.
- Maintain the same brand identity across web and Android.

## Brand personality

Sha'sapp should feel:

- Friendly
- Trustworthy
- Modern
- Personal
- Professional
- Approachable

Avoid excessive neon effects, excessive gradients, cartoon-like illustrations, and unnecessarily complicated layouts.

---

# 3. Color System

The application uses a dark-first design system with a corresponding light theme.

All colors should be managed through CSS custom properties in:

`frontend/css/style.css`

## 3.1 Dark theme

| Design token | Color |
|---|---|
| Main background | #0B1020 |
| Primary panel | #111A2E |
| Secondary panel | #172239 |
| Hover panel | #1C2A44 |
| Input background | #101A2E |
| Main text | #F1F5FF |
| Secondary text | #94A3B8 |
| Primary accent | #6D8CFF |
| Accent hover | #5274F5 |
| Success | #43D9A3 |
| Danger | #FF7272 |
| Outgoing message | #334DB1 |
| Incoming message | #19263D |

## 3.2 Light theme

| Design token | Color |
|---|---|
| Main background | #F2F5FB |
| Primary panel | #FFFFFF |
| Secondary panel | #F7F9FD |
| Hover panel | #EDF1F9 |
| Input background | #F1F4FA |
| Main text | #182238 |
| Secondary text | #758198 |
| Primary accent | #4668ED |
| Accent hover | #3455D6 |
| Success | #119B73 |
| Danger | #DC4545 |
| Outgoing message | #4668ED |
| Incoming message | #EDF1F8 |

## 3.3 Color usage rules

- Dark navy is the primary application background.
- Panels should be slightly lighter than the background.
- Blue is reserved for important actions and selected states.
- Green indicates successful operations.
- Red indicates errors or destructive actions.
- Muted gray-blue is used for secondary information.
- Do not use bright colors for every element.
- Never sacrifice text contrast for visual appearance.

## 3.4 Theme behavior

The application must support:

- Dark theme.
- Light theme.
- Theme toggle.
- Consistent theme across all application screens.
- Proper contrast for inputs, messages, menus, dialogs, and buttons.

The existing `body.light-theme` CSS class should remain the foundation of light-theme styling.

---

# 4. Typography

## Primary font

Inter

Fallback fonts:

- Segoe UI
- Arial
- Sans-serif

## Typography hierarchy

| Element | Recommended size |
|---|---|
| Main page heading | 29–36px |
| Section heading | 18–21px |
| Chat contact name | 13–16px |
| Normal body text | 14px |
| Secondary information | 11–12px |
| Small labels | 10–12px |
| Brand name | 21px |

## Typography rules

- Use bold weights for important headings.
- Use medium weights for navigation and labels.
- Use regular weights for normal messages.
- Keep line heights comfortable.
- Avoid excessive uppercase text.
- Use letter spacing carefully for small eyebrow labels.
- Ensure long names and email addresses do not break the layout.

---

# 5. Layout System

The application has two main layout areas:

1. Conversation sidebar.
2. Main chat workspace.

## 5.1 Desktop layout

The desktop interface should use a two-column layout.

### Sidebar

The sidebar contains:

- Sha'sapp branding.
- Theme toggle.
- Logged-in user's profile.
- Logout button.
- Messages heading.
- Conversation count.
- Conversation search.
- All, Unread, and Groups filters.
- Conversation list.
- Connection information.

### Main workspace

The main workspace contains:

- Empty state when no conversation is selected.
- Selected conversation header.
- Contact avatar.
- Contact name and status.
- Message search.
- Message history.
- Message composer.
- Relevant conversation actions.

## 5.2 Layout dimensions

Existing desktop design:

- Default sidebar width: 300px.
- Wide desktop sidebar: 320px.
- Medium desktop sidebar: 265px.
- Main workspace: remaining available width.

The sidebar and chat area must remain usable without horizontal overflow.

## 5.3 Responsive breakpoints

Use the existing responsive breakpoints as the starting point.

| Screen width | Behavior |
|---|---|
| Above 1250px | Wide desktop layout |
| 851–1250px | Standard desktop layout |
| 601–850px | Compact desktop layout |
| 600px and below | Mobile single-screen navigation |

Do not remove existing responsive behavior without testing its replacement.

---

# 6. Authentication Screen

The authentication screen is the first impression of Sha'sapp.

It should look simple, secure, and welcoming.

## Layout

- Full-screen background.
- Subtle blue decorative gradients.
- Centered authentication card.
- Sha'sapp brand at the top.
- Short welcome heading.
- Clear description.
- Form fields.
- Primary authentication button.
- Register/login switching action.
- Privacy-focused footer.

## Authentication components

### Brand

Display the Sha'sapp logo and wordmark.

### Welcome heading

Examples:

- Welcome back.
- Create your account.
- Your conversations start here.

### Input fields

- Full name during registration.
- Email address.
- Password.
- Show/hide password control.

### Primary button

Use the accent blue color.

The button should have:

- Clear action text.
- Comfortable padding.
- Rounded corners.
- Hover and active states.
- Loading state during submission.
- Disabled state when appropriate.

### Error handling

Display errors near the relevant form.

Do not use browser alerts as the default notification system.

### Privacy footer

Suggested text:

PRIVATE CONVERSATIONS. MEANINGFUL CONNECTIONS.

---

# 7. Main Messaging Interface

The messaging workspace is the most important part of Sha'sapp.

It must be fast to understand and comfortable for long conversations.

## 7.1 Sidebar header

Contains:

- Brand logo.
- Brand name.
- Theme toggle.

Keep the header compact and visually balanced.

## 7.2 User profile section

Contains:

- User avatar.
- Full name.
- Email or profile information.
- Logout action.

The profile should have a subtle panel background and rounded border.

## 7.3 Conversation heading

Display:

- Messages title.
- Total conversation count.

The count must reflect actual application data, not a hardcoded value.

## 7.4 Conversation search

Provide a search input with:

- Search icon.
- Clear placeholder.
- Visible focus state.
- Responsive width.

Search should filter the actual available conversation data.

## 7.5 Conversation filters

The existing interface includes:

- All
- Unread
- Groups

Selected filters should use the accent background.

Unselected filters should remain visually subtle.

Do not display a filter as functional if it does not actually filter the underlying data.

## 7.6 Conversation items

Each conversation item should support:

- Contact avatar.
- Contact or group name.
- Last message preview.
- Last message time.
- Unread count when applicable.
- Selected conversation state.

Use a subtle hover background.

Do not overcrowd each conversation item.

---

# 8. Chat Workspace

## 8.1 Chat header

Display:

- Back button on mobile.
- Contact avatar.
- Contact name.
- Availability or connection status, only when verified.
- Message search action.
- Conversation information action.

The header must remain visible while scrolling through messages.

## 8.2 Empty state

When no conversation is selected:

- Display the Sha'sapp brand illustration.
- Show a welcoming heading.
- Explain how to start.
- Provide an appropriate action if available.

Suggested heading:

Every conversation starts somewhere.

Suggested description:

Select a conversation to get started. Your next meaningful connection is one message away.

The empty state must not look like an error.

## 8.3 Message history

Messages should be displayed in a vertically scrollable area.

### Incoming messages

- Align to the left.
- Use the incoming message background.
- Use readable foreground text.
- Include timestamps where appropriate.

### Outgoing messages

- Align to the right.
- Use the outgoing message background.
- Use readable white text in the dark theme.
- Include timestamps and real delivery/read indicators when available.

### Message spacing

- Keep comfortable vertical spacing.
- Avoid unnecessarily large gaps.
- Maintain readable message widths.
- Preserve long-message wrapping.

### Date separators

Use clear separators for different dates when supported by message data.

---

# 9. Message Composer

The message composer should be positioned at the bottom of the chat workspace.

It should remain usable while message history scrolls independently.

## Composer elements

Depending on implemented functionality:

- Attachment action.
- Text input.
- Emoji action.
- Send button.
- Media preview.
- Voice recording control.

## Visual rules

- Rounded container.
- Subtle border.
- Dark or light input surface according to theme.
- Clear placeholder.
- Visible keyboard focus.
- Blue send button.
- Disabled state when sending is unavailable.

## Behavior

- Enter should send a message when appropriate.
- Multiline text should remain supported if implemented.
- Prevent duplicate submissions.
- Show sending failures clearly.
- Do not clear a message before its submission has been safely handled.
- Display upload progress for media where possible.

Do not show a microphone, attachment, video, or emoji control as functional unless its action is actually implemented.

---

# 10. Contacts and People Discovery

The Find People experience should make connecting with other registered users straightforward.

## Search screen

Display:

- Search input.
- Matching registered users.
- User avatar.
- Full name.
- Relevant public profile information.
- Relationship status.
- Contact request action.

## Relationship states

The interface should distinguish:

- Not connected.
- Request sent.
- Incoming request.
- Accepted contact.

Each state must have a clear visual representation.

## Contact requests

Incoming requests should be easy to recognize.

Actions:

- Accept.
- Decline.

Use clear confirmation and success/error feedback.

Do not make a contact appear accepted until the backend confirms the operation.

## Privacy

Never display another user's private information unnecessarily.

Phone contact matching must be permission-based and must only process contacts selected by the user.

---

# 11. Conversation Information

The conversation information panel should use a clean card-based design.

When implemented, it may contain:

- Contact or group name.
- Profile image.
- Relevant participant information.
- Shared media.
- Conversation settings.
- Available actions.

Only display information supported by actual backend data.

Avoid displaying fake online status, fake last-seen information, or fabricated message statistics.

---

# 12. Buttons and Interaction States

All interactive elements should have consistent visual states.

## Primary buttons

Use for:

- Sign in.
- Create account.
- Send message.
- Confirm important actions.

Appearance:

- Blue background.
- White text.
- Rounded corners.
- Strong readable font weight.

## Secondary buttons

Use for:

- Cancel.
- Back.
- Non-destructive secondary actions.

Appearance:

- Transparent or secondary panel background.
- Subtle border.
- Main text color.

## Icon buttons

Use for:

- Theme toggle.
- Logout.
- Search.
- Conversation information.
- Mobile navigation.

Rules:

- Consistent dimensions.
- Rounded corners.
- Clear hover state.
- Accessible labels.
- Visible keyboard focus.

## Interaction states

Every button should support appropriate:

1. Default.
2. Hover.
3. Active.
4. Focus.
5. Disabled.
6. Loading, when applicable.

---

# 13. Cards, Borders, Shadows and Radius

## Border radius

Use a consistent rounded design.

Recommended values:

| Element | Radius |
|---|---|
| Small controls | 9–12px |
| Inputs | 12px |
| Buttons | 12px |
| Conversation items | 12–15px |
| Profile panels | 15px |
| General cards | 18px |
| Authentication card | 21–26px |

## Borders

Use subtle borders based on the existing `--border` variable.

Avoid thick borders around every component.

## Shadows

Use soft shadows for important floating surfaces.

The existing shadow token should remain the default foundation:

`0 25px 80px rgba(0, 0, 0, 0.28)`

Do not apply heavy shadows to every conversation item or button.

---

# 14. Animation and Motion

Animations should improve feedback and orientation, not distract users.

Recommended transitions:

- Button hover: 150–200ms.
- Theme changes: approximately 250ms.
- Modal appearance: 150–220ms.
- Small hover transformations: 1–2px.

Use subtle motion for:

- Opening dialogs.
- Changing selected conversations.
- Hovering over buttons.
- Showing notifications.
- Theme switching.

Avoid:

- Continuous distracting animations.
- Large bouncing elements.
- Excessive glowing effects.
- Long transitions that delay user interaction.

Respect `prefers-reduced-motion`.

---

# 15. Responsive and Mobile Design

Mobile users must have the same essential messaging functionality as desktop users.

## Mobile navigation

The existing mobile design uses a single-screen navigation model.

When no chat is selected:

- Show the conversation sidebar.
- Hide the chat workspace.

When a chat is selected:

- Hide the sidebar.
- Show the chat workspace.
- Display the back button.

The back button should return to the conversation list without unexpectedly losing application state.

## Mobile requirements

- Minimum supported viewport width: 320px.
- No unnecessary horizontal scrolling.
- Comfortable touch targets.
- Readable text.
- Proper keyboard behavior.
- Composer remains accessible above the keyboard.
- Message history remains independently scrollable.
- Long names and messages wrap correctly.
- Authentication form fits small screens.

## Android

The Capacitor Android application should preserve the web design identity.

Pay particular attention to:

- Android status bar appearance.
- Safe areas.
- Keyboard resizing.
- Back navigation.
- Touch interactions.
- Media permissions.
- Image and video previews.

Do not assume that a successful browser test proves Android functionality.

---

# 16. Loading, Empty, Success and Error States

Every important feature should provide appropriate feedback.

## Loading

Examples:

- Loading conversations.
- Searching for people.
- Loading message history.
- Sending messages.
- Uploading media.

Use subtle loading indicators.

## Empty states

Examples:

- No conversations yet.
- No contacts found.
- No incoming requests.
- No matching messages.

Use friendly, informative descriptions.

## Success

Examples:

- Contact request sent.
- Request accepted.
- Message sent.
- Profile updated.

Use subtle success notifications.

## Error

Examples:

- Network unavailable.
- Authentication expired.
- Message failed.
- Media upload failed.
- Unauthorized conversation access.

Show understandable messages and allow retry when appropriate.

Never show a success state when the backend operation has failed.

---

# 17. Accessibility

The interface must remain usable for people with different accessibility needs.

Requirements:

- Use semantic HTML.
- Use labels for form inputs.
- Provide accessible names for icon-only buttons.
- Maintain readable color contrast.
- Support keyboard navigation.
- Use visible focus indicators.
- Use appropriate ARIA attributes.
- Avoid communicating status through color alone.
- Respect reduced-motion preferences.
- Provide useful alternative text for meaningful images.
- Ensure dialogs have appropriate keyboard and focus behavior.

Do not remove accessibility features to achieve a particular visual effect.

---

# 18. Design Tokens and CSS Architecture

Keep the design system centralized in:

`frontend/css/style.css`

The existing CSS variables should remain the primary source of truth.

Core variables:

```css
:root {
    --bg: #0b1020;
    --panel: #111a2e;
    --panel-2: #172239;
    --panel-hover: #1c2a44;
    --input-bg: #101a2e;

    --text: #f1f5ff;
    --muted: #94a3b8;
    --border: rgba(148, 163, 184, 0.15);

    --accent: #6d8cff;
    --accent-hover: #5274f5;
    --accent-soft: rgba(109, 140, 255, 0.13);

    --bubble-out: #334db1;
    --bubble-in: #19263d;

    --success: #43d9a3;
    --danger: #ff7272;

    --radius: 18px;
    --shadow: 0 25px 80px rgba(0, 0, 0, 0.28);
}
```

Do not scatter hardcoded colors across newly created components.

If a new visual element needs a color, first check whether an existing token can be reused.

---

# 19. Design Consistency Rules

Every future design change must follow these rules:

1. Preserve the Sha'sapp brand identity.
2. Keep dark blue as the primary design direction.
3. Maintain a consistent light theme.
4. Reuse existing CSS variables.
5. Preserve the existing desktop sidebar and chat workspace concept.
6. Preserve mobile single-screen navigation.
7. Use consistent border radii.
8. Keep buttons and inputs visually consistent.
9. Use subtle animations.
10. Keep typography readable.
11. Avoid unnecessary visual clutter.
12. Maintain accessibility.
13. Never break working functionality for visual improvements.
14. Do not create duplicate CSS rules unnecessarily.
15. Do not introduce a new frontend framework without explicit approval.

---

# 20. AI Design and Development Instructions

Any AI assistant modifying the Sha'sapp interface must follow these instructions.

Before changing the UI:

1. Read this DESIGN.md.
2. Read RULES.md.
3. Inspect the existing HTML and CSS.
4. Understand the JavaScript behavior connected to the interface.
5. Identify existing reusable classes and design tokens.
6. Determine whether the request requires a visual change, functional change, or both.

When implementing a design:

- Preserve working application behavior.
- Do not remove existing IDs used by JavaScript.
- Do not rename CSS classes without checking their usage.
- Do not replace the entire interface for a small design request.
- Keep desktop, tablet, and mobile layouts functional.
- Use existing theme variables.
- Avoid fake UI controls.
- Avoid hardcoded user information.
- Test both dark and light themes.
- Test the affected screen at mobile and desktop sizes.

After changes, report:

- Files modified.
- Visual improvements.
- Functional changes.
- Responsive behavior checked.
- Tests performed.
- Remaining issues.

---

# 21. Final Design Goal

Sha'sapp should become a polished, modern, privacy-conscious messaging application with a recognizable visual identity.

The final experience should feel:

- Smooth.
- Minimal.
- Responsive.
- Personal.
- Professional.
- Reliable.
- Consistent across web and Android.

**The most important rule: Improve the existing Sha'sapp design without destroying its identity or breaking its working features.**

---

**End of DESIGN.md**
