/* ===== Configuration ===== */
const API = 'https://script.google.com/macros/s/AKfycby1HPkyo0TcFQwObaz7pOm-Vy5CYOi0l8OSY_9v-S891MNUNrzyV4H8PEkzENOx_eAC/exec';   // the Web app URL from Apps Script (Deploy > Manage deployments)
const CONTACT_EMAIL = 'sophiratech@gmail.com';
/* STATES, OPTIONS and the city/area loader live in lists.js (loaded before this file). */

/* ===== Utilities ===== */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(action, p = {}) {
  let r, j;
  // text/plain keeps this a "simple" request, which Apps Script accepts from any website
  try { r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, ...p }) }); }
  catch (e) { throw new Error('Cannot reach the server. Check your internet connection and try again.'); }
  try { j = await r.json(); } catch (e) { throw new Error('The server returned an unexpected response. Please try again.'); }
  if (!j.ok) throw new Error(j.error); return j.data;
}

/* Dropdown (multi or single): same look everywhere */
function dd(host, o) {
  let items = o.items || [], off = false, loading = false; const sel = new Set();
  host.classList.add('dd'); host.innerHTML = '<button type="button" class="dd-b"><span></span><i>▾</i></button><div class="dd-p"></div>';
  const btn = host.querySelector('.dd-b'), lab = host.querySelector('span'), p = host.querySelector('.dd-p');
  const apply = () => { btn.disabled = off || loading; if (btn.disabled) host.classList.remove('o'); };
  const draw = () => {
    const all = o.all && !o.single && items.length, full = all && sel.size === items.length;
    p.innerHTML = (all ? `<label><input type="checkbox" data-a ${full ? 'checked' : ''}> Select all ${o.all}</label><hr class="dv">` : '') +
      (items.length ? items.map((v, i) => `<label><input type="checkbox" data-i="${i}" ${sel.has(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('') : '<label>No options available</label>');
    lab.textContent = loading ? 'Loading…' : !sel.size ? (o.ph || 'Select') : full ? 'All ' + o.all : sel.size < 3 ? [...sel].join(', ') : sel.size + ' selected';
  };
  p.onchange = e => {
    const i = e.target;
    if (i.dataset.a != null) { i.checked ? items.forEach(v => sel.add(v)) : sel.clear(); }
    else if (o.single) { const v = items[i.dataset.i], same = sel.has(v); host.classList.remove('o'); if (same) { draw(); return; } sel.clear(); sel.add(v); }
    else i.checked ? sel.add(items[i.dataset.i]) : sel.delete(items[i.dataset.i]);
    draw(); o.on && o.on();
  };
  btn.onclick = () => { $$('.dd.o').forEach(x => x !== host && x.classList.remove('o')); host.classList.toggle('o'); };
  draw();
  return { get: () => [...sel], clear() { sel.clear(); draw(); },
    disable(v) { off = v; apply(); },
    busy(v) { loading = v; apply(); draw(); },
    set(a) { items = a; [...sel].forEach(v => !items.includes(v) && sel.delete(v)); draw(); },
    put(a, fire) { sel.clear(); a.forEach(v => sel.add(v)); draw(); fire && o.on && o.on(); } };
}
document.addEventListener('click', e => { if (!e.target.closest('.dd')) $$('.dd.o').forEach(x => x.classList.remove('o')); });

/* State -> City -> Zone: the state list is built in; choosing a state loads only that state's cities and areas. */
function cascade(h, zoneSingle, onError) {
  const u = a => [...new Set(a)].sort(); let S, C, Z, L = [], tok = 0; const g = d => d.get();
  const cs = () => u(L.map(r => r[0]));
  const zs = () => u(L.filter(r => g(C).includes(r[0])).map(r => r[1]));
  const lock = () => { C.disable(!g(S).length); Z.disable(!g(C).length); };
  const pick = async () => {
    C.clear(); Z.clear(); L = []; C.set([]); Z.set([]); lock();
    const st = g(S)[0]; if (!st) return;
    const mine = ++tok; C.busy(true);
    try { const rows = await stateLocations(st); if (mine !== tok) return; L = rows; C.set(cs()); }
    catch (e) { if (mine === tok) onError && onError(e); }
    if (mine === tok) { C.busy(false); lock(); }
  };
  S = dd(h[0], { items: STATES, single: true, ph: 'Select state', on: pick });
  C = dd(h[1], { items: [], single: true, ph: 'Select city', on: () => { Z.clear(); Z.set(zs()); lock(); } });
  Z = dd(h[2], { items: [], single: zoneSingle, all: zoneSingle ? null : 'zones', ph: 'Select zone / sector / village' });
  lock();
  return [S, C, Z];
}

/* ===== Content helpers ===== */
/*BUILD-START*/
const head = (t, s) => `<div class="ph"><h1>${t}</h1><p>${s}</p></div>`;
const sec = (h, b) => `<section class="sec"><h2>${h}</h2>${b}</section>`;
const grid = a => `<div class="grid">${a.map(([t, d]) => `<article class="card"><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`;
const steps = a => `<ol class="steps">${a.map(([t, d], i) => `<li><b>${i + 1}</b><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ol>`;
const faq = a => a.map(([q, x]) => `<details><summary>${q}</summary><p>${x}</p></details>`).join('');
const doc = a => a.map(([h, t]) => sec(h, `<p>${t}</p>`)).join('');
const chips = s => String(s).split(',').map(x => `<span class="chip">${esc(x.trim())}</span>`).join('');

/* Page registry: file name, nav label, SEO title and description for every page */
const PAGES = {
  home:    { file: 'index.html',            label: 'Home',             title: 'Find Home Tutors Near You in India – Padhai Adda',
             desc: 'Find home tutors and tuition near you in India. Search by state, city, area, class and subject, then call the tutor directly. Free, no sign-up, no commission.' },
  find:    { file: 'find-tutor.html',       label: 'Find Tutor',       title: 'Find a Tutor Near You by Area, Class, Subject – Padhai Adda',
             desc: 'Search tutors near you by state, city, area, class, subject and teaching mode: at home, at the tutor’s place or online. Compare fees and call in one tap.' },
  list:    { file: 'list-as-tutor.html',    label: 'List as a Tutor',  title: 'List as a Tutor for Free in India – Padhai Adda',
             desc: 'Create a free tutor listing on Padhai Adda and let students and parents nearby call you directly. No listing fee, no commission. Every profile is reviewed.' },
  how:     { file: 'how-it-works.html',     label: 'How it Works',     title: 'How it Works: Find a Tutor or List Yourself – Padhai Adda',
             desc: 'See how Padhai Adda works for students, parents and tutors: search with filters, compare tutor cards, call or navigate, or list your own tutoring profile.' },
  faq:     { file: 'faqs.html',             label: 'FAQs',             title: 'FAQs: Finding and Listing Tutors – Padhai Adda',
             desc: 'Answers about Padhai Adda: finding a tutor near you, online tutors, fees, listing for free, tutor reviews, payments and missing cities or areas.' },
  blog:    { file: 'blog.html',             label: 'Blog',             title: 'Tuition Tips Blog for Parents and Tutors – Padhai Adda',
             desc: 'Practical tuition advice for parents and tutors: choosing a local tutor, home vs online tuition, comparing fees, board exam prep, safety and demo classes.' },
  terms:   { file: 'terms-of-service.html', label: 'Terms of Service', title: 'Terms of Service – Padhai Adda',
             desc: 'Read the terms of service for using Padhai Adda, the free local tutor directory: eligibility, tutor listings, fees, acceptable use and more.' },
  privacy: { file: 'privacy-policy.html',   label: 'Privacy Policy',   title: 'Privacy Policy – Padhai Adda',
             desc: 'How Padhai Adda collects, shows and stores tutor listing data, how location is used, and how to hide or delete your profile.' },
  contact: { file: 'contact.html',          label: 'Contact',          title: 'Contact Padhai Adda – Update a Listing or Report an Issue',
             desc: 'Contact the Padhai Adda team to update a listing, report a problem or request a missing city or area. We usually reply within two working days.' },
  about:   { file: 'about.html',            label: 'About',            title: 'About Padhai Adda – Free Local Tutor Directory',
             desc: 'Padhai Adda is a free, simple way to connect local learners with local tutors across India, with no middlemen and no fees.' }
};
const LINK = Object.fromEntries(Object.entries(PAGES).map(([k, v]) => [k, v.file]));   // page key -> file name

/* ===== Pages ===== */
const P = {
  home: () => `<div class="hero"><div><span class="tag">Free for students and tutors</span><h1>Find the right tutor, right in your neighbourhood.</h1>
<p>Padhai Adda helps students and parents discover local tutors by state, city, sector, class, subject and teaching mode, and helps tutors get noticed by families nearby.</p>
<div class="cta"><a class="btn" href="${LINK.find}">Find Tutors</a><a class="btn alt" href="${LINK.list}">List as a Tutor</a></div></div>
<article class="slip tilt" aria-label="Example of a tutor card"><header><div style="font-size:1.15rem;line-height:1.25">Example tutor card</div><small>PA-0000</small></header><div class="slip-b">
<p class="fee"><b>₹1,500</b>/month<span>5 years of experience</span></p><div class="row"><b>Area:</b> Sector 19, Ghaziabad</div>
<div><span class="chip">Class 9</span><span class="chip">Class 10</span><span class="chip">Mathematics</span><span class="chip">Online</span></div>
<p>Every card has Call and Navigate buttons so you can reach the tutor in one tap.</p></div></article></div>` +
    sec('Features', grid([['Hyperlocal search', 'Narrow results to your sector, society or village instead of scrolling through a whole city.'],
      ['Flexible filters', 'Pick one, several or all options for location, class, subject and mode.'],
      ['One-tap calling', 'Open your phone dialer with the tutor’s number already filled in.'],
      ['Map navigation', 'Open Google Maps at the tutor’s teaching location and get directions.'],
      ['Clear tutor cards', 'See fees, experience, qualifications, subjects and teaching style at a glance.'],
      ['Reviewed listings', 'Every tutor profile is reviewed by our team before it appears in search.']])) +
    sec('Why Padhai Adda', grid([['Built for local learning', 'Offline and home tuition work best close to home, so distance is part of every search.'],
      ['No middlemen', 'You contact the tutor directly. We take no commission.'],
      ['Honest information', 'Fees in ₹ per month and experience in years make comparison quick.'],
      ['Simple for everyone', 'No sign-up and no app install. Works on any phone, tablet or computer.']])) +
    sec('How it works', steps([['Choose your filters', 'Select location, class, subject and teaching mode.'], ['Compare tutors', 'Read the cards and shortlist by fees, experience and style.'], ['Call or navigate', 'Speak to the tutor or open the map to reach their location.']])) +
    sec('Pricing', `<div class="price"><h2>₹0</h2><p>Searching and listing are completely free. No subscriptions, no listing fees, no hidden charges.</p></div>`) +
    sec('Are you a student or a tutor?', `<div class="split"><div class="card"><h3>I’m a student or parent</h3><p>Find a tutor close to you for school subjects, board exam preparation or college courses.</p><div class="cta"><a class="btn" href="${LINK.find}">Find Tutors</a></div></div>
<div class="card"><h3>I’m a tutor</h3><p>Create a free listing, show your experience and let nearby families reach you by phone.</p><div class="cta"><a class="btn" href="${LINK.list}">List as a Tutor</a></div></div></div>`) +
    sec('Questions?', `<p>Read the <a href="${LINK.faq}">FAQs</a>, see <a href="${LINK.how}">How it Works</a> in detail or <a href="${LINK.contact}">contact us</a>.</p>`),

  find: () => head('Find Tutors', 'Choose a state, then a city, then your area, class, subject and teaching mode. Every filter must be selected to see tutors.') +
    `<div class="panel"><div class="fg">${['State', 'City', 'Zone / Sector / Village', 'Class', 'Subject', 'Teaching Mode'].map((l, i) => `<div class="f"><label>${l}</label><div id="ff${i}"></div></div>`).join('')}</div>
<div class="cta"><button type="button" class="btn" id="go">Find Tutors</button><button type="button" class="btn alt" id="rs">Reset filters</button></div></div>
<div id="res" style="margin-top:2rem"></div>` +
    sec('No tutor showing?', `<div class="grid"><div class="card"><h3>Search deeper</h3><p>Choose another zone, sector or village in your city, or try a different class or subject.</p></div>
<div class="card"><h3>Try another mode</h3><p>Many tutors teach online. Add Online to your Teaching Mode selection to widen your options.</p></div>
<div class="card"><h3>Know a tutor?</h3><p>Ask them to create a free listing so others nearby can find them too.</p><div class="cta"><a class="btn alt" href="${LINK.list}">List a tutor</a></div></div></div>`) +
    sec('Search tips', `<ul style="padding-left:1.2rem"><li>Pick your state first, then your city, then your area. Each list unlocks after the one before it.</li><li>Compare at least three tutors before you decide.</li><li>Ask for a trial class and confirm schedule and fees by phone.</li></ul>`) +
    sec('Home tuition, tutor’s place or online', `<p>Padhai Adda lists tutors who teach at the student’s home, at the tutor’s place or online. Choose the teaching modes you are open to and compare the results. Not sure which suits your child? Read our guide to <a href="/blog#home-tuition-or-online-tuition">home, tutor’s place or online tuition</a>.</p>`) +
    sec('Find a tutor for your class and subject', `<p>Search by class and subject to reach tutors for school subjects, board exam preparation and college courses. Compare fees in ₹ per month, experience and qualifications on each card, then call the tutor to arrange a demo class. Our tips on <a href="/blog#how-to-choose-a-local-tutor">choosing the right local tutor</a> and <a href="/blog#make-the-most-of-a-demo-class">making the most of a demo class</a> can help.</p>`) +
    sec('Questions about finding a tutor', `<details><summary>How do I find a home tutor near me?</summary><p>Select your state, city and area, then your class, subject and the teaching mode At Student Home. Add the other modes if you want to see more tutors.</p></details><details><summary>Can I contact a tutor directly?</summary><p>Yes. Each card has a Call button that opens your phone dialer and a Navigate button that opens Google Maps. There is no middleman and no commission.</p></details><details><summary>What if my area is not listed?</summary><p>Tell us on the <a href="/contact">contact page</a> with your state, city and area name, or read the <a href="/faqs">FAQs</a>.</p></details>`),

  list: () => head('List as a Tutor', 'Create a free listing. Our team reviews every profile before it goes live.') +
    `<div class="panel"><div class="fg">
<div class="f"><label for="n">Name</label><input id="n" maxlength="80" autocomplete="name"></div>
<div class="f"><label for="c">Contact (10 digits)</label><input id="c" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel-national"></div>
<div class="f"><label>Qualifications</label><div id="q"></div></div>
<div class="f"><label>State</label><div id="ls"></div></div><div class="f"><label>City</label><div id="lc"></div></div><div class="f"><label>Zone / Sector / Village</label><div id="lz"></div></div>
<div class="f"><label>Classes Taught</label><div id="cl"></div></div><div class="f"><label>Subjects Taught</label><div id="su"></div></div>
<div class="f"><label for="fe">Fees (₹/month)</label><input id="fe" type="number" min="0" inputmode="numeric"></div>
<div class="f"><label>Teaching Mode</label><div id="tm"></div></div>
<div class="f"><label for="ex">Experience (years)</label><input id="ex" type="number" min="0" step="0.5" inputmode="decimal"></div>
<div class="f"><label>Status</label><div id="st"></div></div>
<div class="f w"><label for="de">Description (your teaching style and what makes you different)</label><textarea id="de" maxlength="500"></textarea></div>
<div class="f w"><label>Current Teaching Location</label><button type="button" class="btn alt" id="loc">Capture my current location</button><p id="lt" style="margin-top:.6rem">Location not captured yet.</p></div></div>
<div class="consent" style="margin-top:1.2rem"><h2 style="font-size:1.15rem;line-height:1.25;padding-bottom:.4rem;margin-bottom:.5rem;border-bottom:1px dashed var(--l)">Your data and consent</h2><ul style="padding-left:1.2rem"><li><b>What we collect:</b> your name, phone number, qualifications, state, city, area, classes, subjects, fees, teaching mode, experience, description, status and teaching location (coordinates).</li><li><b>Why:</b> to show your tutor profile so students and parents can call you and navigate to you.</li><li><b>Who sees it:</b> once approved and Active, all of these details, including your phone number and location, are visible to anyone who visits this website.</li><li><b>Where it is stored:</b> in a Google Sheet through Google Apps Script, managed by the Padhai Adda team. Google acts as our service provider.</li><li><b>Withdraw any time:</b> email sophiratech@gmail.com with your Teacher ID to hide, correct or delete your listing. We delete your data within 3 days of a deletion request.</li></ul><label class="ck"><input type="checkbox" id="cs"><span>I am 18 or older. I have read the <a href="/privacy-policy">Privacy Policy</a> and I consent to Padhai Adda collecting, storing and publicly displaying the details above for this purpose.</span></label></div>
<div class="msg" id="msg" role="alert"></div><div class="cta"><button type="button" class="btn" id="sub">Submit listing</button></div></div>` +
    sec('Before you submit', `<p>Use your real name and a working phone number. Capture the location while you are at the place where you teach, so students can navigate to you. Inactive profiles are saved but hidden from search.</p>`) +
    sec('Why list as a tutor on Padhai Adda', `<p>Padhai Adda is free for tutors: no listing fee and no commission. Families nearby search by area, class, subject and teaching mode, then call you directly from your tutor card.</p><p style="margin-top:.7rem">Your card shows your fees, experience, qualifications, subjects and teaching style, so choose your words with care. Our guide to <a href="/blog#build-a-strong-tutor-profile">building a strong tutor profile</a> has practical tips, and <a href="/how-it-works">How it Works</a> explains what our team reviews.</p>`) +
    sec('Tutor listing questions', `<details><summary>Is it free to list as a tutor?</summary><p>Yes. Listing is free and we charge no commission.</p></details><details><summary>When will my profile appear in search?</summary><p>After our team reviews it, if its status is Active. Inactive profiles are saved but hidden.</p></details><details><summary>Who can list as a tutor?</summary><p>You must be 18 or older. See our <a href="/terms-of-service">Terms of Service</a> for details.</p></details><details><summary>How do I change my details later?</summary><p>Email sophiratech@gmail.com with your Teacher ID and the changes you need.</p></details><details><summary>How do I withdraw consent or delete my data?</summary><p>Email sophiratech@gmail.com with your Teacher ID. We delete your data within 3 days of a deletion request. Read the <a href="/privacy-policy">Privacy Policy</a> for your other rights.</p></details>`),

  how: () => head('How it Works', 'Padhai Adda is a simple directory. Here is what happens on each side.') +
    sec('For students and parents', steps([['Open Find Tutor', 'No account is needed.'], ['Set your filters', 'Choose state, city, area, class, subject and mode. Multiple choices are allowed.'], ['Review the cards', 'Compare fees, experience, qualifications and descriptions.'], ['Call or navigate', 'Talk to the tutor and arrange a demo class.']])) +
    sec('For tutors', steps([['Fill the listing form', 'Add your details, subjects, classes, fees and teaching mode.'], ['Capture your location', 'One tap saves the place where you teach.'], ['Get your Teacher ID', 'Keep it safe. It identifies your listing.'], ['Get approved', 'Once reviewed, active profiles appear in search results.']])) +
    sec('What we review', grid([['Complete details', 'Valid 10-digit phone, realistic fees and experience.'], ['Clear description', 'No misleading claims or promotional spam.'], ['Correct location', 'A valid teaching location and area.']])),

  faq: () => head('Frequently Asked Questions', 'Quick answers for students, parents and tutors.') +
    faq([['Is Padhai Adda free?', 'Yes. Searching and listing are free, and we charge no commission.'],
      ['Do I need an account?', 'No. Students search without signing up. Tutors fill one form.'],
      ['How are tutors verified?', 'Our team reviews each submission for completeness and quality. We recommend you also meet the tutor and ask for a demo class.'],
      ['Why is my listing not visible?', 'It may be awaiting review, or its status is Inactive. Inactive profiles are saved but hidden.'],
      ['Can I select more than one class or subject?', 'Yes. Every filter allows one, several or all options.'],
      ['How do I change my details?', `Email ${CONTACT_EMAIL} with your Teacher ID and the changes you need.`],
      ['Why does Navigate need a location?', 'Tutors capture their teaching location once. Navigate opens it in Google Maps.'],
      ['My city or area is missing.', 'Tell us through the contact page and we will add it.'],
      ['Who handles payments?', 'Fees are agreed directly between tutor and student. Padhai Adda does not handle payments.']]),

  blog: () => head('Blog', 'Practical advice for learners, parents and tutors.') +
    [['How to choose the right local tutor', 'Start with the subject and class, then check experience and teaching style. Shortlist three tutors, ask for a demo class and confirm the schedule, location and fees before committing. Choose someone close enough that travel does not eat into study time.'],
      ['Home, tutor’s place or online?', 'Home tuition suits younger children who need supervision. A tutor’s place offers a focused setting and often lower fees. Online works well for older students, niche subjects and busy schedules. Many tutors offer more than one mode.'],
      ['Building a strong tutor profile', 'Be specific about the classes and subjects you teach. Mention methods such as weekly tests or doubt sessions, and your availability. A short, honest description earns more calls than a long promotional one.'],
      ['Making the most of a demo class', 'Bring a topic your child finds hard. Watch how the tutor explains, whether they ask questions and how they handle mistakes. Agree on feedback, homework and a monthly review before you start.']]
      .map(([t, b]) => `<article class="card" style="margin-bottom:1.2rem"><h3 style="font-size:1.4rem">${t}</h3><p>${b}</p></article>`).join(''),

  terms: () => head('Terms of Service', 'By using Padhai Adda you agree to these terms.') +
    doc([['1. The service', 'Padhai Adda is a free directory that helps students find tutors and helps tutors list their services. We are not a party to any arrangement between users.'],
      ['2. Eligibility', 'You must be 18 or older to list as a tutor. Students under 18 should use the service with a parent or guardian.'],
      ['3. Tutor listings', 'You must provide accurate information. Fake qualifications, wrong contact details or misleading claims lead to removal without notice.'],
      ['4. Reviews and approval', 'We may approve, reject, edit or remove any listing to maintain quality.'],
      ['5. Fees and payments', 'Fees are set by tutors and agreed directly with students. We do not process payments and are not responsible for disputes.'],
      ['6. Acceptable use', 'Do not use the service for spam, harassment, scraping or any unlawful activity.'],
      ['7. No guarantee', 'We do not guarantee the quality, availability or results of any tutor. Use your own judgement and meet in safe, public or supervised settings where appropriate.'],
      ['8. Changes', 'We may update these terms. Continued use means you accept the updated terms.']]),

  privacy: () => head('Privacy Policy', 'What we collect, why, and how it is used.') +
    doc([['1. What tutors share', 'Name, phone number, qualifications, area, classes, subjects, fees, mode, experience, description and teaching location coordinates.'],
      ['2. What is public', 'Active, approved listings show the details above, including phone number and location, so students can call and navigate.'],
      ['3. What students share', 'Students are not asked for personal data. Searches are not tied to an identity.'],
      ['4. Location', 'Your device location is requested only when you tap the capture button on the listing form and is used once.'],
      ['5. Storage', 'Data is stored in a Google Sheet through Google Apps Script, managed by the Padhai Adda team. Google acts as our service provider.'],
      ['6. Your choices', `Set your profile to Inactive to hide it, or email ${CONTACT_EMAIL} with your Teacher ID to correct or delete your data.`],
      ['7. Security', 'We limit access to listing data to administrators, but no online service is completely secure.']]),

  contact: () => head('Contact', 'We read every message.') +
    grid([['Email', `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`], ['Listing changes', 'Include your Teacher ID and the details to update or remove.'],
      ['Missing locations', 'Share your state, city and area name and we will add it.'], ['Response time', 'We usually reply within two working days.']]) +
    sec('Report a problem', `<p>If a listing looks wrong or unsafe, email us with the Teacher ID and what you saw. We review reports promptly.</p><div class="cta"><a class="btn" href="mailto:${CONTACT_EMAIL}">Email us</a></div>`),

  about: () => head('About Padhai Adda', 'A free, simple way to connect local learners and local tutors.') +
    sec('Our mission', '<p>Good teaching is often a few streets away. Padhai Adda makes it easy to find it, and gives independent tutors a free place to be seen.</p>') +
    sec('What we believe', grid([['Local first', 'Learning works best when it is convenient and close.'], ['Free access', 'No fees for families, none for tutors.'], ['Direct and honest', 'No middlemen, clear information, simple tools.']])) +
    sec('How we work', '<p>Tutors submit a profile, our team reviews it, and approved active profiles appear in search. Locations, subjects and classes are maintained by our team and expand as new areas join.</p>')
};

/*BUILD-END*/

/* ===== Page behaviour ===== */
const INIT = {};
const card = t => `<article class="slip"><header><h3>${esc(t.Name)}</h3><small>${esc(t['Teacher ID'])}</small></header><div class="slip-b">
<p class="fee"><b>₹${esc(t.Fees)}</b>/month<span>${esc(t.Experience)} year${t.Experience == 1 ? '' : 's'} of experience</span></p>
<div class="row"><b>Area:</b> ${esc(t['Zone/Sector/Village'])}, ${esc(t.City)}, ${esc(t.State)}</div>
<div class="row"><b>Qualifications</b><br>${chips(t.Qualifications)}</div><div class="row"><b>Classes</b><br>${chips(t['Classes Taught'])}</div>
<div class="row"><b>Subjects</b><br>${chips(t['Subjects Taught'])}</div><div class="row"><b>Mode</b><br>${chips(t['Teaching Mode'])}</div><p>${esc(t.Description)}</p>
<div class="cta"><a class="btn" href="tel:${esc(t.Contact)}">Call</a><a class="btn alt" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t['Current Teaching Location'])}">Navigate</a></div></div></article>`;

INIT.find = () => {
  const fail = e => { if (CUR === 'find') $('#res').innerHTML = `<div class="msg on">Could not load cities and areas: ${esc(e.message)}</div>`; };
  const [S, C, Z] = cascade([$('#ff0'), $('#ff1'), $('#ff2')], false, fail);
  const K = dd($('#ff3'), { items: OPTIONS.classes, ph: 'Select class' }), U = dd($('#ff4'), { items: OPTIONS.subjects, ph: 'Select subject' }),
    M = dd($('#ff5'), { items: OPTIONS.modes, ph: 'Select teaching mode' });
  const run = async () => {
    const miss = [['State', S], ['City', C], ['Zone / Sector / Village', Z], ['Class', K], ['Subject', U], ['Teaching Mode', M]].filter(x => !x[1].get().length).map(x => x[0]);
    if (miss.length) { $('#res').innerHTML = `<div class="msg on" role="alert">Please select every filter to see tutors. Still missing: ${miss.join(', ')}.</div>`; return; }
    $('#res').innerHTML = '<p>Searching…</p>';
    try {
      const r = await api('search', { state: S.get(), city: C.get(), zone: Z.get(), cls: K.get(), subject: U.get(), mode: M.get() });
      $('#res').innerHTML = `<h2>${r.length} tutor${r.length === 1 ? '' : 's'} found</h2>` + (r.length ? `<div class="grid">${r.map(card).join('')}</div>` : '<div class="card"><h3>No tutors match these filters</h3><p>Try clearing the area filter or changing the class, subject or mode.</p></div>');
    } catch (e) { $('#res').innerHTML = `<div class="msg on">Search failed: ${esc(e.message)}</div>`; }
  };
  $('#go').onclick = run;
  $('#rs').onclick = () => mount(CUR);
};

INIT.list = () => {
  let geo = '';
  const say = (t, on = true) => { const m = $('#msg'); if (m) { m.textContent = t; m.classList.toggle('on', on); } };
  const [S, C, Z] = cascade([$('#ls'), $('#lc'), $('#lz')], true, e => say('Could not load cities and areas: ' + e.message));
  const Q = dd($('#q'), { items: OPTIONS.qualifications, ph: 'Select qualifications' }), K = dd($('#cl'), { items: OPTIONS.classes, ph: 'Select classes' }),
    U = dd($('#su'), { items: OPTIONS.subjects, ph: 'Select subjects' }), M = dd($('#tm'), { items: OPTIONS.modes, ph: 'Select teaching mode' });
  const T = dd($('#st'), { items: ['Active', 'Inactive'], single: true, ph: 'Select status' });
  $('#c').oninput = e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  $('#loc').onclick = () => {
    if (!navigator.geolocation) return say('This browser cannot share location. Try another browser.');
    $('#lt').textContent = 'Getting location…';
    navigator.geolocation.getCurrentPosition(p => { geo = p.coords.latitude.toFixed(6) + ',' + p.coords.longitude.toFixed(6); $('#lt').textContent = 'Captured: ' + geo; say('', false); },
      () => { $('#lt').textContent = 'Location blocked. Allow location access for this site and try again.'; }, { enableHighAccuracy: true, timeout: 15000 });
  };
  $('#sub').onclick = async () => {
    const d = { 'Name': $('#n').value.trim(), 'Contact': $('#c').value, 'Qualifications': Q.get(), 'State': S.get()[0] || '', 'City': C.get()[0] || '',
      'Zone/Sector/Village': Z.get()[0] || '', 'Classes Taught': K.get(), 'Subjects Taught': U.get(), 'Fees': $('#fe').value, 'Teaching Mode': M.get(),
      'Experience': $('#ex').value, 'Description': $('#de').value.trim(), 'Status': T.get()[0] || '', 'Current Teaching Location': geo };
    const req = { Name: 'your name', Qualifications: 'your qualifications', State: 'a state', City: 'a city', 'Zone/Sector/Village': 'a zone, sector or village', 'Classes Taught': 'the classes you teach',
      'Subjects Taught': 'the subjects you teach', 'Teaching Mode': 'a teaching mode', Status: 'a status', Description: 'a description' };
    for (const k in req) if (!d[k] || !d[k].length) return say('Please enter ' + req[k] + '.');
    if (!/^\d{10}$/.test(d.Contact)) return say('Contact must be exactly 10 digits.');
    if (d.Fees === '' || +d.Fees < 0) return say('Enter fees in ₹ per month.');
    if (d.Experience === '' || +d.Experience < 0) return say('Enter experience in years.');
    if (!geo) return say('Capture your current teaching location before submitting.');
    if (!$('#cs').checked) return say('Please read the privacy notice and tick the consent box to submit your listing.');
    d.Consent = 'Yes';
    say('', false); $('#sub').disabled = true; $('#sub').textContent = 'Submitting…';
    try {
      const r = await api('submit', { data: d });
      $('#main').innerHTML = head('Listing submitted', 'Thank you. Your profile appears in search after review, if its status is Active.') +
        `<div class="panel"><p>Your Teacher ID</p><div class="id">${esc(r.id)}</div><p>Save this ID. You will need it for any change request.</p><div class="cta"><a class="btn" href="${LINK.home}">Back to Home</a></div></div>`;
      scrollTo(0, 0);
    } catch (e) { say('Could not submit: ' + e.message); $('#sub').disabled = false; $('#sub').textContent = 'Submit listing'; }
  };
};

/* ===== Page boot =====
   Each page is a real HTML file with its content already in the markup (good for Google).
   This script only wires up the interactive parts. */
const CUR = document.body.dataset.page || 'home';
function mount(k) {   // re-render a page in place (used by Reset filters and Retry)
  $('#main').innerHTML = P[k]();
  scrollTo(0, 0);
  INIT[k] && INIT[k]();
}
$('#menu').onclick = () => document.body.classList.toggle(innerWidth > 900 ? 'min' : 'nav');
INIT[CUR] && INIT[CUR]();
