const API_BASE_URL = 'https://api3.growceanu.com/api/rest/';
const DEFAULT_IMAGE = 'https://cdn.prod.website-files.com/68b050fbb5db71e378de9264/693000c423b43158575a083f_campaign-placeholder.svg';
const CAMPAIGN_CONTAINER_ID = 'single-campaign-container';
const CAMPAIGN_OPEN_STAGE_ID = '06909c7c-e94a-40de-8903-d8127e6e604d';
const CAMPAIGN_INVEST_URL_PREFIX = 'https://app.growceanu.com/startup/'; 

function sanitizeHtml(html) {
  if (typeof html !== 'string' && !(html instanceof String)) {
    return '';
  }

  const allowedTags = new Set(['DIV', 'P', 'B', 'STRONG', 'I', 'EM', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'A']);
  const classValueSanitizer = /[^\w- ]+/g;
  const safeHref = /^(https?:|mailto:|tel:|\/|#)/i;

  const template = document.createElement('template');
  template.innerHTML = String(html);

  const elements = template.content.querySelectorAll('*');
  for (let i = 0; i < elements.length; i += 1) {
    const node = elements[i];

    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(document.createTextNode(node.textContent || ''));
      continue;
    }

    const attrs = node.attributes;
    for (let j = attrs.length - 1; j >= 0; j -= 1) {
      const attr = attrs[j];
      const name = attr.name.toLowerCase();

      if (name === 'class') {
        const cleanClass = attr.value.replace(classValueSanitizer, ' ').trim().replace(/\s+/g, ' ');
        if (cleanClass) node.setAttribute('class', cleanClass);
        else node.removeAttribute('class');
        continue;
      }

      if (node.tagName === 'A' && name === 'href') {
        const value = attr.value.trim();
        if (safeHref.test(value)) {
          node.setAttribute('href', value);
        } else {
          node.removeAttribute('href');
        }
        continue;
      }

      if (node.tagName === 'A' && name === 'target') {
        const target = attr.value.trim();
        if (target === '_blank' || target === '_self') {
          node.setAttribute('target', target);
          if (target === '_blank') node.setAttribute('rel', 'noopener noreferrer');
        } else {
          node.removeAttribute('target');
        }
        continue;
      }

      if (node.tagName === 'A' && name === 'rel') {
        const rel = attr.value.toLowerCase().split(/\s+/).filter(Boolean);
        if (rel.length) node.setAttribute('rel', Array.from(new Set(rel.concat(['noopener', 'noreferrer']))).join(' '));
        else node.removeAttribute('rel');
        continue;
      }

      if (name.startsWith('on')) {
        node.removeAttribute(attr.name);
        continue;
      }

      node.removeAttribute(attr.name);
    }
  }

  return template.innerHTML;
}

async function fetchJson(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
	if (!response.ok) {
    const locale = (document.documentElement?.lang || '').toLowerCase() || 'en';
    const isEnglish = locale === 'en' || locale.startsWith('en-');
    const path = isEnglish ? '/opportunities' : `/${locale}/campanii`;
    window.location.href = path;
		throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
	}
	return response.json();
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

function formatDate(target_date) {
  if (typeof target_date !== 'string') return '';

  const [y, m, d] = target_date.split('-').map(Number);
  if (!y || !m || !d) return '';

  const date = new Date(Date.UTC(y, m - 1, d));

  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() + 1 === m &&
    date.getUTCDate() === d
  )
    ? target_date
    : '';
}

const setText = (root, selector, value) => {
  const el = root?.querySelector(selector);
  if (el) el.textContent = value ?? '';
};

const setTextAll = (root, selector, value) => {
  if (!root) return;
  const nodes = root.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i += 1) {
    nodes[i].textContent = value ?? '';
  }
};

const setAttr = (root, selector, attr, value) => {
  const el = root?.querySelector(selector);
  if (!el) return;
  if (value == null || value === '') el.removeAttribute(attr);
  else el.setAttribute(attr, value);
};

const setHidden = (root, selector, hidden = true) => {
  const nodes = root.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i += 1) {
    nodes[i].style.display = hidden ? 'none' : '';
  }
};

// Deal-term rows are `.div-block-108` wrappers (label + value) rendered twice
// on the page: the desktop `.dealtermscontent` table and the mobile copy.
// (The Type row uses `.div-block-107`.) When a value is zero/empty we hide the
// whole row instead of rendering a "-" placeholder, so a Campaign-preparation
// round only shows the terms it has.
const DEAL_TERM_ROW_SELECTOR = '.div-block-107, .div-block-108';
const setDealTermRow = (root, valueSelector, show, value) => {
  if (!root) return;
  const nodes = root.querySelectorAll(valueSelector);
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const row = node.closest(DEAL_TERM_ROW_SELECTOR);
    if (show) {
      node.textContent = value ?? '';
      if (row) row.style.display = '';
    } else if (row) {
      row.style.display = 'none';
    } else {
      node.textContent = '';
    }
  }
};

// `video_url` may be a bare Wistia media id ("cve4u971j4") or a full URL
// ("https://<acct>.wistia.com/medias/<id>"). Extract the id from either; the
// old code stripped all non-id chars, which turned a full URL into a garbage
// string that still passed the modal's validator but never loaded.
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

function formatThousands(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return `${value}`;
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const parts = abs.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const result = parts.length > 1 ? parts[0] + ',' + parts[1] : parts[0];
  return (isNegative ? '-' : '') + result;
}

function populateCampaignInfo(card, { name, imageUrl, remainingDays, description, amountInvested, amountInvestedPercent, preMoneyValuation, postMoneyValuation, foundersCommitments, externalCommitments, growceanuTargetRound, investorCount, raisingAmount, minimumTicket, maxTicket, videoId, displayTags, link, longDescription, campaignOpen, campaignType, targetDate }) {
	
  const img = card.querySelector('.campaign-box-image img');
  if (img) img.src = imageUrl || DEFAULT_IMAGE;
  /*const imgBox = card.querySelector('.campaign-box-image');
  if (imgBox) {
    imgBox.style.setProperty('--imgcampbox', `url(${imageUrl || DEFAULT_IMAGE})`);
  }*/

  [
    ['.campaign-box-description', description],
    ['.campaign-box-time-days', remainingDays],
    ['.campaign-raising-value', "€" + formatNumberToUnit(raisingAmount)],
    ['.campaign-raising-percent', amountInvestedPercent + "%"],
    ['.campaign-box-investors-count', investorCount]
  ].forEach(([sel, val]) => setText(card, sel, val));

  // A 0% chip carries no information (no commitments and no investments yet) —
  // hide it instead of rendering "0%" next to the raising amount.
  setHidden(card, '.campaign-raising-percent', !(Number.isFinite(amountInvestedPercent) && amountInvestedPercent > 0));

  setTextAll(card, '.campaign-title', name);

  // Type is a deal-term row (.div-block-107): hide it when empty or "-"
  // (e.g. a Campaign-preparation round with no round_type set yet).
  const showType = typeof campaignType === 'string' && campaignType.trim() !== '' && campaignType.trim() !== '-';
  setDealTermRow(card, '.campaign-type', showType, campaignType);

  // Hide the investors pill when a round has no investors yet (e.g. a
  // Campaign-preparation round). Live rounds always have > 0, so no change.
  setHidden(card, '.campaign-box-investors', !(Number.isFinite(investorCount) && investorCount > 0));

  const longDescriptionEl = card.querySelector('.campaign-long-description');
  if (longDescriptionEl) longDescriptionEl.innerHTML = sanitizeHtml(longDescription ?? '');

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
  
  // Founder commitments sit above external commitments on the KIIS sheet; like
  // every other deal term, a zero/absent value hides the whole row rather than
  // rendering "€0". Harmless before `.campaign-founders-commitments` exists in
  // Webflow — setDealTermRow no-ops when the selector matches nothing.
  const showFoundersCommitments = Number.isFinite(foundersCommitments) && foundersCommitments > 0;
  setDealTermRow(card, '.campaign-founders-commitments', showFoundersCommitments, "€" + formatThousands(foundersCommitments));

  const showExternalCommitments = Number.isFinite(externalCommitments) && externalCommitments > 0;
  setDealTermRow(card, '.campaign-external-commitments', showExternalCommitments, "€" + formatThousands(externalCommitments));

  const showGrowceanuTargetRound = Number.isFinite(growceanuTargetRound) && growceanuTargetRound > 0;
  setDealTermRow(card, '.campaign-growceanu-target-round', showGrowceanuTargetRound, "€" + formatThousands(growceanuTargetRound));

  const showAmountInvested = Number.isFinite(amountInvested) && amountInvested > 0;
  setDealTermRow(card, '.campaign-amount-invested', showAmountInvested, "€" + formatThousands(amountInvested));

  const showPreValuation = Number.isFinite(preMoneyValuation) && preMoneyValuation > 0;
  setDealTermRow(card, '.campaign-valuation-pre-full', showPreValuation, "€" + formatThousands(preMoneyValuation));
  setText(card, '.campaign-valuation', showPreValuation ? "€" + formatNumberToUnit(preMoneyValuation) : '');
  setHidden(card, '.campaign-box-valuation', !showPreValuation);

  const showPostValuation = Number.isFinite(postMoneyValuation) && postMoneyValuation > 0;
  setDealTermRow(card, '.campaign-valuation-post-full', showPostValuation, "€" + formatThousands(postMoneyValuation));

  const showMinimum = Number.isFinite(minimumTicket) && minimumTicket > 0;
  setDealTermRow(card, '.campaign-min-invest', showMinimum, "€" + formatThousands(minimumTicket));

  // Target date is a deal-term row too: hide it when the round has no valid date.
  const showTargetDate = typeof targetDate === 'string' && targetDate.trim() !== '';
  setDealTermRow(card, '.campaign-target-date', showTargetDate, targetDate);

  const showMaxim = Number.isFinite(maxTicket) && maxTicket > 0;
  setTextAll(card, '.campaign-max-invest', showMaxim ? "€" + maxTicket : '');
  setHidden(card, '.campaign-max-container', !showMaxim);

  //TODO: rewrite this
  const showVideoBtn = videoId != null;
  //setText(card, '.campaign-box-play-button', showVideoBtn ? minimumTicket : '');
  setHidden(card, '.campaign-box-play-button', !showVideoBtn);
  setAttr(card, '.campaign-box-play-button', 'data-video-id', videoId);
  setAttr(card, '.campaign-box-play-button', 'data-title', remainingDays);

  setAttr(card, '.campaign-page-invest-button', 'href', link);

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

async function renderRound(container, cid) {
  const locale = (document.documentElement?.lang || '').toLowerCase() || 'en';
  const isEnglish = locale === 'en' || locale.startsWith('en-');
  const redirectToOpportunities = () => {
    const path = isEnglish ? '/opportunities' : `/${locale}/campanii`;
    window.location.href = path;
  };

  if (!cid || cid == "" || cid == null) {
    redirectToOpportunities();
    return;
  }

	const endpoint = `campaign?id=${encodeURIComponent(cid)}&lang=${encodeURIComponent(isEnglish ? 'en' : locale)}&en=${isEnglish}`;
	const { rounds = [] } = await fetchJson(endpoint);

	if (!Array.isArray(rounds) || rounds.length < 1) {
    redirectToOpportunities();
		return;
	}
  
	const [{ 
    name, 
    round_images: images, 
    target_date, 
    startup, 
    minimum_ticket, 
    round_totals,
    round_investors_aggregate,
    video_url,
    tags, 
    raising_amount, 
    pre_money_valuation, post_money_valuation,
    external_commitments,
    founders_commitments,
    growceanu_target_round,
    idea, 
    id, 
    stage_id, 
    round_type,
    max_ticket,
    cover,
    }] = rounds;

    const remainingDays = calculateRemainingDays(target_date);
    const targetDate = formatDate(target_date);
			
    const displayName = typeof name === 'string' && name.trim() ? name : 'Untitled campaign';

    // Set the browser tab title to the company name (round `name` is a fallback,
    // since it can be a round label like "Pre-Seed" rather than the company).
    const companyName = (startup && typeof startup === 'object' && typeof startup.name === 'string' && startup.name.trim())
      ? startup.name.trim()
      : displayName;
    if (companyName) document.title = companyName;

    const rawDescription = typeof startup === 'string'
      ? startup
      : (typeof startup?.description === 'string' ? startup.description : '');

    const normalizedDescription = rawDescription.trim();
    const description = normalizedDescription.length > 99 
      ? `${normalizedDescription.slice(0, 99)}...`
      : normalizedDescription;

    const longDescription = Array.isArray(idea) && idea.length > 0
      ? (() => {
          const t = idea[0];
          if (typeof t.idea === 'string') {
            const idea = t.idea.trim();
            if (idea) return idea;
          }
          
          return '';
        })()
      : '';

    // Preview/poster image for the video box: round_images first, then the REST
    // `cover` ([{ url }]) — some rounds (e.g. Campaign-preparation) have only a
    // cover, no round_images — then the placeholder. Mirrors campaigns-v2.js.
    const roundImageUrl = Array.isArray(images) && typeof images[0]?.image_url === 'string' && images[0].image_url.trim()
      ? images[0].image_url
      : '';
    const coverUrl = Array.isArray(cover) && typeof cover[0]?.url === 'string' && cover[0].url.trim()
      ? cover[0].url
      : '';
    const imageUrl = roundImageUrl || coverUrl || DEFAULT_IMAGE;

    let displayTags = [];
    if (typeof tags !== 'undefined') {
      if (Array.isArray(tags)) {
        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i];
          if (typeof tag === 'string') {
            const trimmed = tag.trim();
            if (trimmed) displayTags.push(trimmed);
          }
        }
      } else if (typeof tags === 'string' && tags.trim()) {
        displayTags.push(tags.trim());
      }
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
    const postMoneyValuation = typeof post_money_valuation === 'number' ? post_money_valuation : null;
    const externalCommitments = typeof external_commitments === 'number' ? external_commitments : null;
    const foundersCommitments = typeof founders_commitments === 'number' ? founders_commitments : null;
    const growceanuTargetRound = typeof growceanu_target_round === 'number' ? growceanu_target_round : null;


    // Round progress ("procent atingere tinta runda"), per the KIIS sheet:
    //   amount raised = founder commitments + external commitments + raised on Growceanu
    //   percent       = amount raised / total round value (raising_amount)
    // raising_amount is required to equal founders + external + growceanu_target_round
    // (a data-entry rule on the KIIS sheet — without it the percent can never
    // reach 100%). Any term may be 0/null (a round can be fully backed by
    // commitments before the first platform investment lands), so only
    // raisingAmount gates the calculation.
    const committedAmount = (Number.isFinite(foundersCommitments) ? foundersCommitments : 0)
      + (Number.isFinite(externalCommitments) ? externalCommitments : 0)
      + (Number.isFinite(amountInvested) ? amountInvested : 0);
    const amountInvestedPercent = raisingAmount > 0
      ? Math.round((committedAmount / raisingAmount) * 100 * 10) / 10
      : 0;

    const minimumTicket = typeof minimum_ticket === 'number' ? minimum_ticket : null;
    const maxTicket = typeof max_ticket === 'number' ? max_ticket : null;

    const videoId = parseWistiaId(video_url);

    const campaignOpen = typeof stage_id === 'string' && stage_id.trim() === CAMPAIGN_OPEN_STAGE_ID;
    const campaignType = round_type?.round_type_translations?.[0]?.type || "-";

    let link = "#";;
    if (typeof id === 'string') {
      const sanitizedId = id.toLowerCase().trim().replace(/[^0-9A-Za-z_-]/g, '');

      if (sanitizedId && sanitizedId.length <= 48) {
        link = CAMPAIGN_INVEST_URL_PREFIX + sanitizedId;
      }
    }

    populateCampaignInfo(container, {
			name: displayName,
			imageUrl, 
      remainingDays, 
      description, 
      amountInvested, 
      amountInvestedPercent,
      preMoneyValuation, 
      postMoneyValuation,
      foundersCommitments,
      externalCommitments,
      growceanuTargetRound,
      investorCount, 
      raisingAmount,
      minimumTicket,
      maxTicket,
      videoId,
      displayTags: displayTags, 
      link,
      longDescription,
      campaignOpen,
      campaignType,
      targetDate
		});

    //trigger play
    waitForVideoPopup();
}

const extractCid = (search) =>
{
  const query = typeof search === 'string'
    ? search
    : (typeof window !== 'undefined' && typeof window.location?.search === 'string' ? window.location.search : '');
  if (!query)
  {
    return null;
  }

  const cidParam = new URLSearchParams(query).get('cid');
  if (typeof cidParam !== 'string')
  {
    return null;
  }

  // Extract the first well-formed UUID; ignore any junk (e.g. a UTM block folded
  // in after a stray second "?") so the value handed to the API / invest link is
  // always a valid uuid or null — never a mangled 48-char string Postgres rejects.
  const match = cidParam.toLowerCase().match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  );

  return match ? match[0] : null;
}

async function initCampaign() {
  const container = document.getElementById(CAMPAIGN_CONTAINER_ID);
	if (!container) {
		return;
	}

	try {
		await renderRound(container, extractCid());
	} catch (error) {
		console.error('Failed to load campaign.', error);
	}
}

if (typeof document !== 'undefined') (function () {

  initCampaign();

  document.addEventListener("DOMContentLoaded", function () {
    preserveCidOnLanguageSwitch();
  });

  function preserveCidOnLanguageSwitch() {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("cid");

    if (!cid) return;

    const langLinks = document.querySelectorAll(".w-locales-items .w-locales-item a[href]");

    langLinks.forEach(link => {
      const url = new URL(link.href);

      url.searchParams.delete("cid");
      url.searchParams.set("cid", cid);

      link.href = url.toString();
    });
  }

})();

// Exported for Node-based unit tests only; this block is inert in the browser
// (no `module`), so nothing about the served script changes.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractCid };
}
