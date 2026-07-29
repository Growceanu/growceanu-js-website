const API_BASE_URL = 'https://api3.growceanu.com/api/rest/';
const LIMIT = Number.isFinite(Number(window.CAMPAIGNS_CONFIG?.limit))
  ? Number(window.CAMPAIGNS_CONFIG.limit)
  : 40;
const LIMITCOMINGSOON = Number.isFinite(Number(window.CAMPAIGNS_CONFIG?.limit_coming_soon))
  ? Number(window.CAMPAIGNS_CONFIG.limit_coming_soon)
  : 10;
const DEFAULT_IMAGE = 'https://cdn.prod.website-files.com/68b050fbb5db71e378de9264/693000c423b43158575a083f_campaign-placeholder.svg';
const CAMPAIGN_CARD_CONTAINER_ID = 'campaigns-grid-container';
const CAMPAIGN_CARD_TEMPLATE_ID = 'campaigns-grid-item';
const CAMPAIGN_URL_PREFIX = '/campaign/';
const CAMPAIGN_URL_PREFIX_RO = '/campanie/';
const CAMPAIGN_OPEN_STAGE_ID = '06909c7c-e94a-40de-8903-d8127e6e604d';

const COMINGSOON_TEXT = "Coming soon";
const COMINGSOON_TEXT_RO = "În curând";
const FOLLOW_TEXT = "Follow";
const FOLLOW_TEXT_RO = "Urmărește";
const FOLLOWLINK = "https://app.growceanu.com/sign-up";
const SEEMORE_TEXT = "See more";
const SEEMORE_TEXT_RO = "Vezi detalii";

async function fetchJson(endpoint) {
	const response = await fetch(`${API_BASE_URL}${endpoint}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
	}
	return response.json();
}

function sanitizeRoundId(id) {
  const sanitized = typeof id === 'string'
    ? id.toLowerCase().trim().replace(/[^0-9A-Za-z_-]/g, '')
    : '';
  return sanitized.length <= 48 ? sanitized : '';
}

// Openable = a detail page exists for the round. Live rounds always have one.
// Among coming-soon rounds only those in Campaign-preparation do, and the
// `campaigns-v2` list carries no per-round flag saying which — so ask the detail
// endpoint: `campaign?id=` returns the round when its page is ready and an empty
// `rounds` array otherwise. One small request per coming-soon card (capped by
// LIMITCOMINGSOON), all in parallel, resolved before render so no card flips
// state after paint. Rounds that fail or 404 stay non-openable (Follow -> sign-up).
// The response is kept because it also carries the cover the list omits.
async function fetchOpenablePrepRounds(group, locale, isEnglish) {
  if (!Array.isArray(group) || group.length === 0) return new Map();

  const entries = await Promise.all(group.map(async function (round) {
    const id = sanitizeRoundId(round?.id);
    if (!id) return null;
    try {
      const data = await fetchJson(
        `campaign?id=${encodeURIComponent(id)}&lang=${encodeURIComponent(isEnglish ? 'en' : locale)}&en=${isEnglish}`
      );
      const detailRound = data && Array.isArray(data.rounds) ? data.rounds[0] : null;
      return detailRound ? [id, detailRound] : null;
    } catch (e) {
      return null;
    }
  }));

  return new Map(entries.filter(Boolean));
}

function calculateRemainingDays(target_date) {
	let remainingDays = null;
	if (typeof target_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
		const timestamp = Date.parse(`${target_date}T00:00:00Z`);
		if (!Number.isNaN(timestamp)) {
			remainingDays = Math.ceil((timestamp - Date.now()) / 86400000);
		}
	}
  
  return (Number.isFinite(remainingDays) && remainingDays >= 0) ? remainingDays : 0;
}

const setText = (root, selector, value) => {
  const el = root?.querySelector(selector);
  if (el) el.textContent = value ?? '';
};

const setAttr = (root, selector, attr, value) => {
  const el = root?.querySelector(selector);
  if (!el) return;
  if (value == null || value === '') el.removeAttribute(attr);
  else el.setAttribute(attr, value);
};

const setHidden = (root, selector, hidden = true) => {
  const el = root?.querySelector(selector);
  if (!el) return;
  el.style.display = hidden ? 'none' : '';
};

const setHiddenClass = (root, selector, hidden = true) => {
  const el = root?.querySelector(selector);
  if (!el) return;

  el.classList.toggle('hidden', hidden);
};

function cloneMemberCard(template) {
	const card = template.cloneNode(true);
	card.removeAttribute('id');
	card.style.display = 'block';
	return card;
}

function formatNumberToUnit(value) {
  if (Number.isNaN(value)) return '';
	if (value >= 1000000) return `${String(Math.round(value / 100000) / 10).replace('.', ',')} mil`;
	if (value >= 1000) return `${String(Math.round(value / 100) / 10).replace('.', ',')} k`;
	return `${value}`;
}

// `video_url` may be a bare Wistia media id ("cve4u971j4") or a full URL
// ("https://<acct>.wistia.com/medias/<id>"). Extract the id from either.
function parseWistiaId(video_url) {
  if (typeof video_url !== 'string') return null;
  const raw = video_url.trim();
  if (!raw) return null;
  let id = raw;
  const medias = raw.match(/\/medias\/([A-Za-z0-9_-]+)/);
  if (medias) {
    id = medias[1];
  } else if (raw.indexOf('/') !== -1) {
    const path = raw.split(/[?#]/)[0].replace(/\/+$/, '');
    id = path.slice(path.lastIndexOf('/') + 1);
  }
  id = id.replace(/[^0-9A-Za-z_-]/g, '');
  return /^[A-Za-z0-9_-]{3,80}$/.test(id) ? id : null;
}

function populateCampaignBox(template, { name, imageUrl, remainingDays, description, amountInvested, amountInvestedPercent, preMoneyValuation, investorCount, raisingAmount, minimumTicket, videoId, displayTags, link, campaignOpen, campaignType, roundGroup, isOpenable }) {
	const card = cloneMemberCard(template);
  
  //if (roundGroup) card.dataset.roundGroup = roundGroup;
	
  const img = card.querySelector('.campaign-box-image img');
  if (img) img.src = imageUrl || DEFAULT_IMAGE;
  const imgBox = card.querySelector('.campaign-box-image');
  if (imgBox) {
    imgBox.style.setProperty('--imgcampbox', `url(${imageUrl || DEFAULT_IMAGE})`);
  }

  [
    ['.campaign-box-title', name],
    ['.campaign-type', campaignType],
    ['.campaign-box-description', description],
    ['.campaign-box-time-days', remainingDays],
    ['.campaign-raising-value', "€" + formatNumberToUnit(raisingAmount)],
    ['.campaign-raising-percent', amountInvestedPercent + "%"],
    ['.campaign-box-investors-count', investorCount]
  ].forEach(([sel, val]) => setText(card, sel, val));

  // A 0% chip carries no information (no commitments and no investments yet) —
  // hide it instead of rendering "0%" next to the raising amount.
  setHidden(card, '.campaign-raising-percent', !(Number.isFinite(amountInvestedPercent) && amountInvestedPercent > 0));

  const locale = (document.documentElement?.lang || '').toLowerCase() || 'en';
  const isEnglish = locale === 'en' || locale.startsWith('en-');

  if (roundGroup == "coming_soon") {
    const comingSoonText = isEnglish ? COMINGSOON_TEXT : COMINGSOON_TEXT_RO;
    setText(card, '.campaign-box-time .w-embed', comingSoonText);
    setHidden(card, '.campaign-box-investors', true);
    // Coming-soon rounds have no funding progress yet: hide the whole raising
    // wrapper (the "Raising" label + amount + percent). Valuation is hidden
    // below for every card, coming-soon or not.
    setHidden(card, '.campaign-box-raising', true);
  }

  if (amountInvestedPercent == 100) {
    const campaignRaisingDiv = card.querySelector('.campaign-raising');
    campaignRaisingDiv.classList.add('campaign-raising-100');
  }

  if (Array.isArray(displayTags) && displayTags.length > 0) {
    const campaignBoxLabelsContainer = card.querySelector('.campaign-box-labels');
    // Clear existing content (removes the initial .campaign-box-label)
    campaignBoxLabelsContainer.innerHTML = '';

    displayTags.forEach(tag => {
      const div = document.createElement('div');
      div.className = 'campaign-box-label';
      div.innerText = tag;
      campaignBoxLabelsContainer.appendChild(div);
    });
  } else {
    setHidden(card, '.campaign-box-labels');
  }
  
  // Valuation is no longer shown on the listing cards (home + /opportunities).
  // It still appears on the campaign detail page — hero box and the Deal Terms
  // pre/post-money rows, both driven by campaign.js. The Webflow template keeps
  // shipping `.campaign-box-valuation`, so hide it unconditionally and leave the
  // value empty; cards then use the same full-width Raising layout that rounds
  // without a valuation already had.
  setText(card, '.campaign-valuation', '');
  setHidden(card, '.campaign-box-valuation', true);

  const showMinimum = Number.isFinite(minimumTicket) && minimumTicket > 0;
  setText(card, '.campaign-box-button-minimum-value', showMinimum ? minimumTicket : '');
  setHidden(card, '.campaign-box-button-minimum', !showMinimum);

  if (roundGroup == "coming_soon" && !isOpenable) {
    // Not openable yet (Origin BCI, RongoDesign): Follow -> sign-up (new tab).
    const followText = isEnglish ? FOLLOW_TEXT : FOLLOW_TEXT_RO;
    setHidden(card, '.campaign-box-button-minimum', true);
    setText(card, '.campaign-box-button-label', followText);
    link = FOLLOWLINK;
    setAttr(card, '.campaign-box', 'target', "_blank");
  }
  else if (roundGroup == "coming_soon" && isOpenable) {
    // Openable Campaign-preparation round (Urban Spaces): the whole card opens
    // the detail page (link already points there), same tab, "See more" CTA.
    const seeMoreText = isEnglish ? SEEMORE_TEXT : SEEMORE_TEXT_RO;
    setHidden(card, '.campaign-box-button-minimum', true);
    setText(card, '.campaign-box-button-label', seeMoreText);
    setAttr(card, '.campaign-box', 'target', "_self");
  }
  else {
    // hide/show invest button
    setHiddenClass(card, '.campaign-box-button', !campaignOpen);
    setHiddenClass(card, '.campaign-box-closed', campaignOpen);
  }

  // Openable cards (live + prep) get a brighter cover so they read as
  // clickable; non-openable coming-soon cards are grayscaled + dimmed so the
  // openable ones clearly stand out.
  if (isOpenable) {
    const overlay = card.querySelector('.campaign-box-overlay-image');
    if (overlay) overlay.style.background = 'linear-gradient(to top, rgba(28,30,44,0.9) 0%, rgba(28,30,44,0.44) 46%, rgba(28,30,44,0.04) 100%)';
    const coverImg = card.querySelector('.campaign-image');
    if (coverImg) coverImg.style.filter = 'saturate(1.08) brightness(1.06)';
  } else if (roundGroup == "coming_soon") {
    const overlay = card.querySelector('.campaign-box-overlay-image');
    if (overlay) overlay.style.background = 'rgba(18,20,29,0.82)';
    const coverImg = card.querySelector('.campaign-image');
    if (coverImg) coverImg.style.filter = 'grayscale(1) brightness(0.6)';
  }


  //TODO: rewrite this
  const showVideoBtn = videoId != null;
  //setText(card, '.campaign-box-play-button', showVideoBtn ? minimumTicket : '');
  setHidden(card, '.campaign-box-play-button', !showVideoBtn);
  setAttr(card, '.campaign-box-play-button', 'data-video-id', videoId);
  setAttr(card, '.campaign-box-play-button', 'data-title', remainingDays);
  setAttr(card, '.campaign-box-play-button', 'data-vm-bound', 0); //reset bound attr 

  setAttr(card, '.campaign-box', 'href', link);
  if (link == null || link === '') {
    card.querySelector('.campaign-box').style.cursor = 'default';
  }

	return card;
}

// run once, re-tries until videomodal.js has defined the API
function waitForVideoPopup() {
  
  if (window.VideoPopup && typeof VideoPopup.init === 'function') {
      VideoPopup.init(); // bind all current [data-video-trigger] elements
      
      return;
    }
    // wait for DOM if needed, then check again shortly
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForVideoPopup, { once: true });
    } else {
      setTimeout(waitForVideoPopup, 50);
    }
    console.log('waiting...');
}

async function renderRounds(container, template) {
  const locale = (document.documentElement?.lang || '').toLowerCase() || 'en';
  const isEnglish = locale === 'en' || locale.startsWith('en-');
	const endpoint = `campaigns-v2?limit=${encodeURIComponent(LIMIT)}&limitComingSoon=${encodeURIComponent(LIMITCOMINGSOON)}&lang=${encodeURIComponent(isEnglish ? 'en' : locale)}&en=${isEnglish}`;
	
	const data = await fetchJson(endpoint);
  const roundGroups = [
    ['live', data?.live_rounds],
    ['coming_soon', data?.coming_soon_rounds],
    ['closed', data?.closed_rounds]
  ];

	if (!roundGroups.some(([, group]) => Array.isArray(group) && group.length > 0)) {
		return;
	}

  // Which coming-soon rounds already have a detail page (see fetchOpenablePrepRounds).
  const openablePrep = await fetchOpenablePrepRounds(data?.coming_soon_rounds, locale, isEnglish);

	const fragment = document.createDocumentFragment();

  for (const [roundGroup, group] of roundGroups) {
    if (!Array.isArray(group) || group.length === 0) continue;

    for (const { name, cover, round_images: images, target_date, startup, minimum_ticket, round_totals, round_investors_aggregate, video_url, id, raising_amount, pre_money_valuation, external_commitments, stage_id, round_type } of group) {

      const remainingDays = calculateRemainingDays(target_date);
        
      const displayName = typeof startup?.name === 'string' ? startup.name.trim() : '';

      const rawDescription = typeof startup === 'string'
        ? startup
        : (typeof startup?.description === 'string' ? startup.description : '');

      const normalizedDescription = rawDescription.trim();
      const description = normalizedDescription.length > 99 
        ? `${normalizedDescription.slice(0, 99)}...`
        : normalizedDescription;

      const sanitizedId = sanitizeRoundId(id);

      // Detail-endpoint payload for coming-soon rounds whose page is ready; also
      // the openable signal (see fetchOpenablePrepRounds).
      const prepDetail = roundGroup === 'coming_soon' ? openablePrep.get(sanitizedId) : null;

      // Campaign cover (REST `cover: [{ url }]`) is the primary image; fall back
      // to the legacy round_images, then the placeholder. The list query returns
      // no cover for some prep rounds (e.g. Urban Spaces) — the detail payload has it.
      const coverUrl = Array.isArray(cover) && typeof cover[0]?.url === 'string' && cover[0].url.trim()
        ? cover[0].url
        : '';
      const prepCoverUrl = Array.isArray(prepDetail?.cover) && typeof prepDetail.cover[0]?.url === 'string' && prepDetail.cover[0].url.trim()
        ? prepDetail.cover[0].url
        : '';
      const roundImageUrl = Array.isArray(images) && typeof images[0]?.image_url === 'string' && images[0].image_url.trim()
        ? images[0].image_url
        : '';
      const imageUrl = coverUrl || prepCoverUrl || roundImageUrl || DEFAULT_IMAGE;

      // Tags live under startup.tags as { tag: { tag_translations: [{ tag }] } };
      // entries with an empty tag_translations array are untranslated for this locale -> skip.
      let displayTags = [];
      const startupTags = Array.isArray(startup?.tags) ? startup.tags : [];
      for (let i = 0; i < startupTags.length; i++) {
        const translations = startupTags[i]?.tag?.tag_translations;
        const label = Array.isArray(translations) && typeof translations[0]?.tag === 'string'
          ? translations[0].tag.trim()
          : '';
        if (label) displayTags.push(label);
      }

      // The API serves round totals as a Hasura aggregate (round_investors_aggregate);
      // round_totals is kept as a fallback for the older aliased shape.
      const totalsAgg = round_investors_aggregate?.aggregate;
      const amountInvested = typeof totalsAgg?.sum?.amount_invested === 'number'
        ? totalsAgg.sum.amount_invested
        : (typeof round_totals?.amount_invested === 'number' ? round_totals.amount_invested : 0);
      const investorCount = typeof totalsAgg?.count === 'number'
        ? totalsAgg.count
        : (typeof round_totals?.investor_count === 'number' ? round_totals.investor_count : 0);
      
      const raisingAmount = typeof raising_amount === 'number' ? raising_amount : 0;  
      const preMoneyValuation = typeof pre_money_valuation === 'number' ? pre_money_valuation : null;
      const externalCommitments = typeof external_commitments === 'number' ? external_commitments : null;
      
      // Progress = external commitments + what has been invested on the platform.
      // Either side may be 0/null (a round can be fully backed by external
      // commitments before the first platform investment lands), so only
      // raisingAmount gates the calculation. Mirrors campaign.js.
      const committedAmount = (Number.isFinite(externalCommitments) ? externalCommitments : 0)
        + (Number.isFinite(amountInvested) ? amountInvested : 0);
      const amountInvestedPercent = raisingAmount > 0
        ? Math.round((committedAmount / raisingAmount) * 100 * 10) / 10
        : 0;

      const minimumTicket = typeof minimum_ticket === 'number' ? minimum_ticket : null;
      const videoId = parseWistiaId(video_url);

      // Openable = live rounds + coming-soon rounds the detail endpoint served.
      const isOpenable = roundGroup === 'live' || Boolean(prepDetail);

      let link = CAMPAIGN_URL_PREFIX;
      if (!isEnglish) link = "/" + locale + CAMPAIGN_URL_PREFIX_RO;

      if (sanitizedId) {
        link += "?cid=" + sanitizedId;
      }

      // Non-openable cards don't deep-link: coming-soon get Follow -> sign-up in
      // populateCampaignBox, closed get no link.
      if (!isOpenable) link = "";

      const campaignOpen = typeof stage_id === 'string' && stage_id.trim() === CAMPAIGN_OPEN_STAGE_ID;
      const campaignType = round_type?.round_type_translations?.type || "-";

      const card = populateCampaignBox(template, {
        name: displayName,
        imageUrl, 
        remainingDays, 
        description, 
        amountInvested, 
        amountInvestedPercent,
        preMoneyValuation,
        investorCount, 
        raisingAmount,
        minimumTicket,
        videoId,
        displayTags: displayTags, 
        link,
        campaignOpen,
        campaignType,
        roundGroup,
        isOpenable
      });

      fragment.appendChild(card);
    }
  }

	container.appendChild(fragment);

  //trigger play
  waitForVideoPopup();

}

async function initCampaigns() {
	const container = document.getElementById(CAMPAIGN_CARD_CONTAINER_ID);
	if (!container) {
		return;
	}

	const template = document.getElementById(CAMPAIGN_CARD_TEMPLATE_ID);
	if (!template) {
		return;
	}

	//template.style.display = 'none';

	try {
		await renderRounds(container, template);
	} catch (error) {
		console.error('Failed to load campaigns.', error);
	}
}

(function () {
	initCampaigns();
})();
