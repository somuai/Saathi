export function demoReply(userText, companionName) {
  const name = companionName || 'Maya';
  const t = (userText || '').toLowerCase();

  if (/\b(mom|dad|mother|father|amma|papa|parent)\b/.test(t)) {
    return `I hear how much they still take up space in the room. Missing them isn't something to rush past. What part of today brought them closest?`;
  }
  if (/\b(dog|cat|pet|puppy|kitten)\b/.test(t)) {
    return `That kind of love doesn't look small from here. The quiet after a companion animal is real. What do you miss most in the ordinary hours?`;
  }
  if (/\b(divorce|broke up|breakup|left me|ex)\b/.test(t)) {
    return `An ending can feel like grief even when the world treats it like news. You don't have to justify how much it hurts. What feels heaviest tonight?`;
  }
  if (/\b(job|laid off|fired|career|retired)\b/.test(t)) {
    return `Losing a chapter of work can scramble who you think you are, not just what you do. That's allowed to hurt. What have you been carrying since?`;
  }
  if (/\b(alone|lonely|nobody|burden)\b/.test(t)) {
    return `Feeling like a burden is one of the loneliest stories grief tells. You don't have to perform okay-ness here. I'm still with you.`;
  }
  if (/\b(angry|furious|unfair)\b/.test(t)) {
    return `Anger belongs in this room too — it often means something precious was taken. You don't have to sand it down. Where does it sit in you right now?`;
  }

  return `Thank you for saying that out loud. I'm here with it, ${name} is still listening. I won't rush you toward a lesson. What else wants to be said?`;
}
