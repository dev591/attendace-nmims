
export const quotes = [
    { text: "Software is a great combination between artistry and engineering.", author: "Bill Gates" },
    { text: "The function of good software is to make the complex appear to be simple.", author: "Grady Booch" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
    { text: "Optimism is an occupational hazard of programming: feedback is the treatment.", author: "Kent Beck" },
    { text: "Programming is not about typing, it's about thinking.", author: "Rich Hickey" },
    { text: "The only way to go fast, is to go well.", author: "Robert C. Martin" },
    { text: "Truth can only be found in one place: the code.", author: "Robert C. Martin" },
    { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
    { text: "Fix the cause, not the symptom.", author: "Steve McConnell" },
    { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "Confusion is part of programming.", author: "Felienne Hermans" },
    { text: "It’s not a bug – it’s an undocumented feature.", author: "Anonymous" },
    { text: "One of my most productive days was throwing away 1000 lines of code.", author: "Ken Thompson" },
    { text: "Deleted code is debugged code.", author: "Jeff Sickel" },
    { text: "If debugging is the process of removing software bugs, then programming must be the process of putting them in.", author: "Edsger W. Dijkstra" },
    { text: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", author: "Bill Gates" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
    { text: "You can’t wait for inspiration. You have to go after it with a club.", author: "Jack London" },
    { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
    { text: "Don't comment bad code - rewrite it.", author: "Brian Kernighan" },
    { text: "A computer is like air conditioning - it becomes useless when you open windows.", author: "Linus Torvalds" },
    { text: "Software undergoes beta testing shortly before it’s released. Beta is Latin for 'still doesn’t work'.", author: "Anonymous" },
    { text: "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.", author: "John Woods" },
    { text: "Walking on water and developing software from a specification are easy if both are frozen.", author: "Edward V. Berard" },
    { text: "Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.", author: "Antoine de Saint-Exupery" },
    { text: "Java is to JavaScript what car is to Carpet.", author: "Chris Heilmann" },
    { text: "Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it.", author: "Brian Kernighan" }
];

export function getDailyQuote() {
    // Rotation based on days since epoch to ensure it changes every 24 hours
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return quotes[dayIndex % quotes.length];
}
