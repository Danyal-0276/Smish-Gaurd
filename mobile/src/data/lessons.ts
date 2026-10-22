import type { Lesson } from "../types/domain";

export const lessons: Lesson[] = [
  {
    id: "pause",
    title: "The power of a pause",
    category: "START HERE",
    duration: 2,
    summary: "Scams create urgency. A few seconds can change your next step.",
    sections: [
      {
        heading: "Pressure is part of the pattern",
        body: "A threat to close your account or a prize that expires can make a message feel urgent. That feeling is a reason to slow down, not evidence that the request is genuine.",
      },
      {
        heading: "Verify somewhere else",
        body: "Open the organizationâ€™s official app yourself, or call a number you already trust. Avoid using contact details supplied by the suspicious message.",
      },
      {
        heading: "You can leave a message unanswered",
        body: "You do not need to reply, click, or share personal details to investigate an unexpected message.",
      },
    ],
    question:
      "A text says your bank account will close in 10 minutes. What is the best next step?",
    options: [
      "Use the textâ€™s link immediately",
      "Open the bankâ€™s official app independently",
      "Reply with your PIN",
    ],
    correctIndex: 1,
    explanation:
      "An independently opened official channel helps you verify the claim without relying on the senderâ€™s link.",
  },
  {
    id: "links",
    title: "Look beyond the link",
    category: "LINK SAFETY",
    duration: 3,
    summary: "Learn what a domain tells youâ€”and what it cannot prove.",
    sections: [
      {
        heading: "Read the actual domain",
        body: "A brand name can appear in a path or a misleading subdomain. Pay attention to the actual registered domain, and verify it against an independently known official address.",
      },
      {
        heading: "A padlock is not a trust badge",
        body: "HTTPS encrypts a connection. A phishing site can also use HTTPS, so it does not establish who owns the page or whether it is safe.",
      },
      {
        heading: "Skip automatic previews",
        body: "Opening or previewing an unknown URL can contact an external server. SmishGuard keeps detected destinations as text and does not fetch them.",
      },
    ],
    question: "Does an HTTPS link guarantee the message is genuine?",
    options: [
      "Yes, always",
      "Only if the sender uses capitals",
      "No, phishing sites can also use HTTPS",
    ],
    correctIndex: 2,
    explanation:
      "Encryption and legitimacy are different properties. Verify the organization independently.",
  },
  {
    id: "codes",
    title: "Keep your codes yours",
    category: "ACCOUNT SAFETY",
    duration: 2,
    summary: "Passwords, PINs, and one-time codes deserve an extra barrier.",
    sections: [
      {
        heading: "An unexpected code is a signal",
        body: "Someone may be attempting a sign-in, or may have entered a wrong number. Do not share the code with someone claiming they need it to help you.",
      },
      {
        heading: "Check the sign-in yourself",
        body: "Use the official app to review account activity. If you think your details were exposed, change your password through that app and follow the providerâ€™s account recovery guidance.",
      },
    ],
    question:
      "Someone claiming to be support asks for your OTP. What should you do?",
    options: [
      "Share half the code",
      "Keep it private and verify through official support",
      "Forward the whole message",
    ],
    correctIndex: 1,
    explanation:
      "Treat login codes as secrets. Use independently verified support channels instead.",
  },
  {
    id: "after-click",
    title: "If you already tapped",
    category: "NEXT STEPS",
    duration: 3,
    summary:
      "Practical steps when a message has already caught your attention.",
    sections: [
      {
        heading: "Stop the interaction",
        body: "Close the page and avoid entering more information or installing anything it offers. A click alone does not establish that an account has been compromised.",
      },
      {
        heading: "Protect what you shared",
        body: "If you entered a password, change it through the official service. If you shared payment details or sent money, contact your bank through a known official number promptly.",
      },
      {
        heading: "Keep useful evidence",
        body: "Keep relevant screenshots for the service provider or reporting process. Do not forward malicious links to other people unnecessarily.",
      },
    ],
    question: "You entered your bank password on a suspicious page. What now?",
    options: [
      "Wait and see",
      "Reply to the sender",
      "Use the official bank channel to secure the account",
    ],
    correctIndex: 2,
    explanation:
      "Act through a trusted official channel and tell the bank what happened.",
  },
];
