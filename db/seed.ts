import { eq } from 'drizzle-orm';
import { db } from './index';
import { vocabulary } from './schema';

const words = [
  // ... (GREETINGS, DAILY, SOCIAL, FOOD, SLANGS, K-POP, K-DRAMA, DATING - same content as before)
  // GREETINGS (인사)
  {"hangeul": "안녕하세요", "romanization": "annyeonghaseyo", "english": "Hello (Polite)", "category": "Greetings"},
  {"hangeul": "감사합니다", "romanization": "gamsahamnida", "english": "Thank you (Formal)", "category": "Greetings"},
  {"hangeul": "죄송합니다", "romanization": "joesonghamnida", "english": "I'm sorry", "category": "Greetings"},
  {"hangeul": "괜찮아요", "romanization": "gwaenchanayo", "english": "It's okay / I'm fine", "category": "Greetings"},
  {"hangeul": "실례합니다", "romanization": "sillyehamnida", "english": "Excuse me", "category": "Greetings"},
  {"hangeul": "반가워요", "romanization": "bangawoyo", "english": "Nice to meet you", "category": "Greetings"},
  {"hangeul": "잘가요", "romanization": "jalgayo", "english": "Goodbye (Go well)", "category": "Greetings"},
  {"hangeul": "잘있어요", "romanization": "jarisseyo", "english": "Goodbye (Stay well)", "category": "Greetings"},

  // DAILY (일상)
  {"hangeul": "빨리빨리", "romanization": "ppalli-ppalli", "english": "Hurry hurry!", "category": "Daily"},
  {"hangeul": "가자", "romanization": "gaja", "english": "Let's go", "category": "Daily"},
  {"hangeul": "진짜?", "romanization": "jinjja?", "english": "Really?", "category": "Daily"},
  {"hangeul": "알았어", "romanization": "arasseo", "english": "Understood / Okay", "category": "Daily"},
  {"hangeul": "몰라", "romanization": "molla", "english": "I don't know", "category": "Daily"},
  {"hangeul": "잠깐만요", "romanization": "jamkkanmanyo", "english": "Wait a moment", "category": "Daily"},
  {"hangeul": "어디에요?", "romanization": "eodiyeyo?", "english": "Where are you?", "category": "Daily"},
  {"hangeul": "학교", "romanization": "hakgyo", "english": "School", "category": "Daily"},

  // SOCIAL (소셜)
  {"hangeul": "언니", "romanization": "eonni", "english": "Older female (used by women)", "category": "Social"},
  {"hangeul": "오빠", "romanization": "oppa", "english": "Older male (used by women)", "category": "Social"},
  {"hangeul": "누나", "romanization": "nuna", "english": "Older female (used by men)", "category": "Social"},
  {"hangeul": "형", "romanization": "hyeong", "english": "Older male (used by men)", "category": "Social"},
  {"hangeul": "친구", "romanization": "chingu", "english": "Friend", "category": "Social"},
  {"hangeul": "선배", "romanization": "seonbae", "english": "Senior", "category": "Social"},
  {"hangeul": "후배", "romanization": "hubae", "english": "Junior", "category": "Social"},
  {"hangeul": "동생", "romanization": "dongsaeng", "english": "Younger sibling/friend", "category": "Social"},

  // FOOD (식사)
  {"hangeul": "맛있다", "romanization": "masitta", "english": "Delicious", "category": "Food"},
  {"hangeul": "배고파", "romanization": "baegopa", "english": "I'm hungry", "category": "Food"},
  {"hangeul": "건배", "romanization": "geonbae", "english": "Cheers!", "category": "Food"},
  {"hangeul": "소주", "romanization": "soju", "english": "Soju", "category": "Food"},
  {"hangeul": "맥주", "romanization": "maekju", "english": "Beer", "category": "Food"},
  {"hangeul": "치킨", "romanization": "chikin", "english": "Chicken", "category": "Food"},
  {"hangeul": "라면", "romanization": "ramyeon", "english": "Ramen", "category": "Food"},
  {"hangeul": "김치", "romanization": "kimchi", "english": "Kimchi", "category": "Food"},

  // SLANGS (유행어)
  {"hangeul": "대박", "romanization": "daebak", "english": "Awesome / Jackpot", "category": "Slangs"},
  {"hangeul": "헐", "romanization": "heol", "english": "OMG / No way", "category": "Slangs"},
  {"hangeul": "심쿵", "romanization": "simkung", "english": "Heart-throbbing", "category": "Slangs"},
  {"hangeul": "내로남불", "romanization": "naeronambul", "english": "Double standard", "category": "Slangs"},
  {"hangeul": "갑분싸", "romanization": "gapbunssa", "english": "Mood killer (sudden silence)", "category": "Slangs"},
  {"hangeul": "존맛", "romanization": "jonmat", "english": "F*cking delicious", "category": "Slangs"},
  {"hangeul": "솔까말", "romanization": "solkkamal", "english": "To be honest", "category": "Slangs"},
  {"hangeul": "꿀잼", "romanization": "kkuljaem", "english": "Tons of fun", "category": "Slangs"},

  // K-POP (케이팝)
  {"hangeul": "최애", "romanization": "choiae", "english": "Bias (Favorite)", "category": "K-Pop"},
  {"hangeul": "차애", "romanization": "chaae", "english": "Bias wrecker", "category": "K-Pop"},
  {"hangeul": "아이돌", "romanization": "aidol", "english": "Idol", "category": "K-Pop"},
  {"hangeul": "데뷔", "romanization": "debi", "english": "Debut", "category": "K-Pop"},
  {"hangeul": "컴백", "romanization": "keombaek", "english": "Comeback", "category": "K-Pop"},
  {"hangeul": "덕질", "romanization": "deokjil", "english": "Fangirling/Fanboying", "category": "K-Pop"},
  {"hangeul": "막내", "romanization": "maknae", "english": "Youngest member", "category": "K-Pop"},
  {"hangeul": "응원봉", "romanization": "eungwonbong", "english": "Lightstick", "category": "K-Pop"},

  // K-DRAMA (드라마)
  {"hangeul": "사장님", "romanization": "sajangnim", "english": "CEO / Boss", "category": "K-Drama"},
  {"hangeul": "본부장님", "romanization": "bonbujangnim", "english": "Director", "category": "K-Drama"},
  {"hangeul": "재벌", "romanization": "jaebeol", "english": "Rich conglomerate", "category": "K-Drama"},
  {"hangeul": "복수", "romanization": "boksu", "english": "Revenge", "category": "K-Drama"},
  {"hangeul": "정", "romanization": "jeong", "english": "Emotional attachment", "category": "K-Drama"},
  {"hangeul": "세자", "romanization": "seja", "english": "Crown Prince", "category": "K-Drama"},
  {"hangeul": "검사", "romanization": "geomsa", "english": "Prosecutor", "category": "K-Drama"},
  {"hangeul": "첫사랑", "romanization": "cheotsarang", "english": "First love", "category": "K-Drama"},

  // DATING (연애)
  {"hangeul": "사랑해", "romanization": "saranghae", "english": "I love you", "category": "Dating"},
  {"hangeul": "보고 싶어", "romanization": "bogo sipeo", "english": "I miss you", "category": "Dating"},
  {"hangeul": "자기야", "romanization": "jagiya", "english": "Honey / Babe", "category": "Dating"},
  {"hangeul": "썸", "romanization": "sseom", "english": "The 'some' stage", "category": "Dating"},
  {"hangeul": "소개팅", "romanization": "sogaeting", "english": "Blind date", "category": "Dating"},
  {"hangeul": "울지마", "romanization": "uljima", "english": "Don't cry", "category": "Dating"},
  {"hangeul": "밀당", "romanization": "mildang", "english": "Push and pull/flirting", "category": "Dating"},
  {"hangeul": "고백", "romanization": "gobaek", "english": "Confession", "category": "Dating"},

  // CITIES (도시) - Korean City Names
  {"hangeul": "서울", "romanization": "Seoul", "english": "Seoul (Capital)", "category": "Cities"},
  {"hangeul": "부산", "romanization": "Busan", "english": "Busan (Port City)", "category": "Cities"},
  {"hangeul": "인천", "romanization": "Incheon", "english": "Incheon (Airport City)", "category": "Cities"},
  {"hangeul": "대구", "romanization": "Daegu", "english": "Daegu", "category": "Cities"},
  {"hangeul": "대전", "romanization": "Daejeon", "english": "Daejeon", "category": "Cities"},
  {"hangeul": "광주", "romanization": "Gwangju", "english": "Gwangju", "category": "Cities"},
  {"hangeul": "수원", "romanization": "Suwon", "english": "Suwon", "category": "Cities"},
  {"hangeul": "제주", "romanization": "Jeju", "english": "Jeju Island", "category": "Cities"},
  {"hangeul": "강남", "romanization": "Gangnam", "english": "Gangnam (Seoul District)", "category": "Cities"},
  {"hangeul": "홍대", "romanization": "Hongdae", "english": "Hongdae (Uni District)", "category": "Cities"},
  {"hangeul": "이태원", "romanization": "Itaewon", "english": "Itaewon (International)", "category": "Cities"},
  {"hangeul": "명동", "romanization": "Myeongdong", "english": "Myeongdong (Shopping)", "category": "Cities"},
  {"hangeul": "경주", "romanization": "Gyeongju", "english": "Gyeongju (Historic City)", "category": "Cities"},
  {"hangeul": "전주", "romanization": "Jeonju", "english": "Jeonju (Hanok Village)", "category": "Cities"},
  {"hangeul": "춘천", "romanization": "Chuncheon", "english": "Chuncheon", "category": "Cities"},
  {"hangeul": "강릉", "romanization": "Gangneung", "english": "Gangneung (East Coast)", "category": "Cities"},

  // SIGNS (표지판) - Korean City Signs & Transit
  {"hangeul": "출구", "romanization": "chulgu", "english": "Exit", "category": "Signs"},
  {"hangeul": "입구", "romanization": "ipgu", "english": "Entrance", "category": "Signs"},
  {"hangeul": "화장실", "romanization": "hwajangsil", "english": "Restroom / Toilet", "category": "Signs"},
  {"hangeul": "지하철", "romanization": "jihacheol", "english": "Subway", "category": "Signs"},
  {"hangeul": "버스 정류장", "romanization": "beoseu jeongnyujang", "english": "Bus Stop", "category": "Signs"},
  {"hangeul": "주차장", "romanization": "juchajang", "english": "Parking Lot", "category": "Signs"},
  {"hangeul": "편의점", "romanization": "pyeonuijeom", "english": "Convenience Store", "category": "Signs"},
  {"hangeul": "약국", "romanization": "yakguk", "english": "Pharmacy", "category": "Signs"},
  {"hangeul": "병원", "romanization": "byeongwon", "english": "Hospital", "category": "Signs"},
  {"hangeul": "경찰서", "romanization": "gyeongchalseo", "english": "Police Station", "category": "Signs"},
  {"hangeul": "위험", "romanization": "wiheom", "english": "Danger", "category": "Signs"},
  {"hangeul": "금지", "romanization": "geumji", "english": "Prohibited", "category": "Signs"},
  {"hangeul": "영업 중", "romanization": "yeongbeop jung", "english": "Open (for business)", "category": "Signs"},
  {"hangeul": "준비 중", "romanization": "junbi jung", "english": "Closed / Preparing", "category": "Signs"},
  {"hangeul": "무료", "romanization": "muryo", "english": "Free (no charge)", "category": "Signs"},
  {"hangeul": "할인", "romanization": "halin", "english": "Discount / Sale", "category": "Signs"},

  // ALPHABET (알파벳) - Consonants
  {"hangeul": "ㄱ", "romanization": "g/k", "english": "Giyeok", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㄴ", "romanization": "n", "english": "Nieun", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㄷ", "romanization": "d/t", "english": "Digeut", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㄹ", "romanization": "r/l", "english": "Rieul", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅁ", "romanization": "m", "english": "Mieum", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅂ", "romanization": "b/p", "english": "Bieup", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅅ", "romanization": "s", "english": "Siot", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅇ", "romanization": "ng", "english": "Ieung", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅈ", "romanization": "j", "english": "Jieut", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅊ", "romanization": "ch", "english": "Chieut", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅋ", "romanization": "k", "english": "Kieuk", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅌ", "romanization": "t", "english": "Tieut", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅍ", "romanization": "p", "english": "Pieup", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅎ", "romanization": "h", "english": "Hieut", "category": "Alphabet", "difficulty": 1},

  // ALPHABET (알파벳) - Vowels
  {"hangeul": "ㅏ", "romanization": "a", "english": "A", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅑ", "romanization": "ya", "english": "Ya", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅓ", "romanization": "eo", "english": "Eo", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅕ", "romanization": "yeo", "english": "Yeo", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅗ", "romanization": "o", "english": "O", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅛ", "romanization": "yo", "english": "Yo", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅜ", "romanization": "u", "english": "U", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅠ", "romanization": "yu", "english": "Yu", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅡ", "romanization": "eu", "english": "Eu", "category": "Alphabet", "difficulty": 1},
  {"hangeul": "ㅣ", "romanization": "i", "english": "I", "category": "Alphabet", "difficulty": 1},
];

export async function seed() {
  try {
    // Check for a word unique to the latest seed version (Alphabet Inclusion)
    const result = await db.select().from(vocabulary).where(eq(vocabulary.hangeul, 'ㄱ')).limit(1);

    if (result.length === 0) {
      console.log('🏙️ Local Oasis: Injecting ALPHABET 00 district...');
      await db.delete(vocabulary);
      await db.insert(vocabulary).values(words);
      console.log('🏙️ Local Oasis: Grand Seeding V4 Complete. 11 Districts fully populated.');
    } else {
      console.log('🏙️ Local Oasis: Districts already synchronized.');
    }
  } catch (e) {
    console.error('Seeding process failed:', e);
  }
}
