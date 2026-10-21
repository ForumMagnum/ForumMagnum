import { getNonEnglishProseRatio } from '@/components/sunshineDashboard/supermod/contentLanguage';
import highlightRuleSeed from '@/server/moderatorHighlights/highlightRuleSeed.json';

const turkishComment = 'Aklıma birşey takıldı ciddi soruyorum ben bu siteyi yapay zeka sayesinde öğrendim buranın sorgulayıcı insanların tartışarak ufkunu genişleteceğimi düşündüm madem bu kadar konu merak ediyoruz tartışıyoruz insanlar dinlerini sorguluyor kendine doğru geliyor bu hintli içinde bir Hıristiyan içinde insanlar bu kadar doğruya iten ve tamam bu doğru diyer konuları araştırıyım diyorlar neden diyer dinleri okuyunca mantıklı gelmiyor senin hıristiyanlığa bağlayan şey ne?';
const english = 'I think this is a very interesting question, but I would like to see more evidence before reaching a conclusion.';

const nonEnglishSamples = [
  ['Turkish from the moderation screenshot', turkishComment],
  ['Turkish without diacritics', 'Aklima birsey takildi ciddi soruyorum ben bu siteyi yapay zeka sayesinde ogrendim buranin sorgulayici insanlarin tartisarak ufkunu genisletecegimi dusundum.'],
  ['French', 'Je pense que cette question mérite une discussion plus approfondie et des exemples concrets.'],
  ['Spanish', 'No estoy de acuerdo con esta idea porque necesitamos pruebas antes de llegar a una conclusión.'],
  ['German', 'Ich habe diesen Artikel gelesen und möchte gerne wissen, warum die Ergebnisse so unterschiedlich sind.'],
  ['Portuguese', 'Eu gostaria de entender melhor esta questão antes de tirar uma conclusão sobre os resultados apresentados.'],
  ['Indonesian', 'Saya ingin memahami mengapa orang percaya pada gagasan ini dan bagaimana kita bisa mengujinya dengan lebih baik.'],
  ['Vietnamese', 'Tôi nghĩ chúng ta cần thảo luận thêm về vấn đề này trước khi đưa ra kết luận cuối cùng.'],
  ['Russian', 'Мне кажется, что нам нужно подробнее обсудить этот вопрос, прежде чем делать окончательные выводы.'],
  ['Arabic', 'أعتقد أننا بحاجة إلى مناقشة هذا الموضوع بشكل أعمق قبل الوصول إلى أي استنتاجات نهائية.'],
  ['Hindi', 'मुझे लगता है कि हमें किसी निष्कर्ष पर पहुंचने से पहले इस विषय पर विस्तार से चर्चा करनी चाहिए।'],
  ['Chinese', '我觉得我们应该先仔细讨论这个问题，再做出最终的判断，而不是没有证据就相信所有的说法。'],
  ['Japanese', 'この問題について結論を出す前に、もっと詳しく話し合う必要があると思います。'],
  ['Korean', '이 문제에 대해 결론을 내리기 전에 더 자세히 논의하고 충분한 증거를 살펴볼 필요가 있다고 생각합니다.'],
];

describe('non-English rejection highlight', () => {
  test.each(nonEnglishSamples)('detects %s', (_language, text) => {
    expect(getNonEnglishProseRatio(`<p>${text}</p>`)).toBeGreaterThan(0.25);
  });

  test('the shipped English rule uses language detection instead of alphabet detection', () => {
    const rule = highlightRuleSeed.rejectionTemplates['We only accept English-language content'];
    expect(rule).toEqual({
      enabled: true,
      groups: [[{ signal: 'focusedNonEnglishProseRatio', operator: 'gt', value: 0.25 }]],
    });
    expect(getNonEnglishProseRatio(turkishComment)).toBeGreaterThan(rule.groups[0][0].value);
  });

  test.each([
    ['English', english],
    ['informal English', 'idk tbh this seems kinda sus lol but i guess we should actually check the numbers before we jump to conclusions'],
    ['English with loanwords and names', 'Gödel and René Descartes met at the café to discuss a naïve idea. I think we should examine their argument more carefully.'],
    ['unrecognized text', 'asdfghjkl qwertyuiop zxcvbnm asdfghjkl qwertyuiop zxcvbnm'],
    ['names', 'Gödel, Turing, von Neumann, Sefa Demir, René Descartes, François Chollet'],
    ['full-width English', 'Ｉ ｔｈｉｎｋ ｔｈｉｓ ｉｓ ａ ｖｅｒｙ ｉｎｔｅｒｅｓｔｉｎｇ ｑｕｅｓｔｉｏｎ ａｎｄ ｗｅ ｓｈｏｕｌｄ ｄｉｓｃｕｓｓ ｉｔ ｍｏｒｅ.'],
  ])('does not flag %s', (_description, text) => {
    expect(getNonEnglishProseRatio(text)).toBeLessThanOrEqual(0.25);
  });

  test.each(['', '<img src="example.png">', 'Merci!', '12345 😀👍', '<p>α + β = γ</p>'])('abstains on insufficient prose: %s', html => {
    expect(getNonEnglishProseRatio(html)).toBeNull();
  });

  test.each(['blockquote', 'q', 'pre', 'code', 'math', 'script', 'style'])('ignores foreign text inside %s', tag => {
    expect(getNonEnglishProseRatio(`<p>${english}</p><${tag}>${turkishComment}</${tag}>`)).toBe(0);
  });

  test('ignores rendered and editable math', () => {
    const math = '<span class="math-tex">α β γ δ ε ζ η θ λ μ ν ξ π ρ σ τ φ χ ψ ω</span>';
    expect(getNonEnglishProseRatio(`<p>${english}</p>${math.repeat(5)}`)).toBe(0);
  });

  test('decodes HTML entities and handles decomposed accents', () => {
    const encoded = Array.from(turkishComment).map(character => `&#${character.codePointAt(0)};`).join('');
    expect(getNonEnglishProseRatio(`<p>${encoded}</p>`)).toBeGreaterThan(0.25);
    expect(getNonEnglishProseRatio(turkishComment.normalize('NFD'))).toBeGreaterThan(0.25);
  });

  test('ignores URL and email noise', () => {
    const links = 'https://example.com/bonjour-comment-allez-vous bonjour@example.fr '.repeat(20);
    expect(getNonEnglishProseRatio(`<p>${english} ${links}</p>`)).toBe(0);
  });

  test('does not let a short English introduction hide a foreign body', () => {
    expect(getNonEnglishProseRatio(`<p>${english}</p><p>${turkishComment}</p>`)).toBeGreaterThan(0.25);
  });

  test('checks beyond the detector\'s input limit in a single paragraph', () => {
    const text = `${english.repeat(12)} ${turkishComment.repeat(12)}`;
    expect(getNonEnglishProseRatio(`<p>${text}</p>`)).toBeGreaterThan(0.25);
  });

  test('detects prose spread across short lines', () => {
    const html = turkishComment.split(' ').map(word => `<p>${word}</p>`).join('');
    expect(getNonEnglishProseRatio(html)).toBeGreaterThan(0.25);
  });

  test('tolerates a small foreign aside in an English discussion', () => {
    expect(getNonEnglishProseRatio(`<p>${english.repeat(12)}</p><p>Je vous remercie pour cette discussion très intéressante.</p>`)).toBeLessThanOrEqual(0.25);
  });

  test('weights mixed-language content by letters, not by paragraph count', () => {
    expect(getNonEnglishProseRatio(`<p>${english.repeat(12)}</p>${'<p>Je vous remercie pour cette discussion très intéressante.</p>'.repeat(2)}`)).toBeLessThanOrEqual(0.25);
  });
});
