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
const FOLLOWLINK = "https://app.growceanu.com/sign-up";

async function fetchJson(endpoint) {
	const response = await fetch(`${API_BASE_URL}${endpoint}`);
	if (!response.ok) {
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
	if (value > 1000000) return `${Math.round(value / 1000000)} mil`;
	if (value > 1000) return `${Math.round(value / 1000)} k`;
	return `${value}`;
}

function populateCampaignBox(template, { name, imageUrl, remainingDays, description, amountInvested, amountInvestedPercent, preMoneyValuation, investorCount, raisingAmount, minimumTicket, videoId, displayTags, link, campaignOpen, campaignType, roundGroup }) {
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

  const locale = (document.documentElement?.lang || '').toLowerCase() || 'en';
  const isEnglish = locale === 'en' || locale.startsWith('en-');

  if (roundGroup == "coming_soon") {
    const comingSoonText = isEnglish ? COMINGSOON_TEXT : COMINGSOON_TEXT_RO;
    setText(card, '.campaign-box-time .w-embed', comingSoonText);
    setHidden(card, '.campaign-box-investors', true);
    setHidden(card, '.campaign-raising-percent', true);
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
  
  const showPreValuation = Number.isFinite(preMoneyValuation) && preMoneyValuation > 0;
  setText(card, '.campaign-valuation', showPreValuation ? "€" + formatNumberToUnit(preMoneyValuation) : '');
  setHidden(card, '.campaign-box-valuation', !showPreValuation);

  const showMinimum = Number.isFinite(minimumTicket) && minimumTicket > 0;
  setText(card, '.campaign-box-button-minimum-value', showMinimum ? minimumTicket : '');
  setHidden(card, '.campaign-box-button-minimum', !showMinimum);

  if (roundGroup == "coming_soon") {
    setHidden(card, '.campaign-box-button-minimum', true);
    setText(card, '.campaign-box-button-label', 'Follow');
    link = FOLLOWLINK;
    setAttr(card, '.campaign-box', 'target', "_blank");
  }
  else {
    // hide/show invest button
    setHiddenClass(card, '.campaign-box-button', !campaignOpen);
    setHiddenClass(card, '.campaign-box-closed', campaignOpen);
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
  
	const fragment = document.createDocumentFragment();

  for (const [roundGroup, group] of roundGroups) {
    if (!Array.isArray(group) || group.length === 0) continue;

    for (const { name, round_images: images, target_date, startup, minimum_ticket, round_totals, video_url, tags, id, raising_amount, pre_money_valuation, external_commitments, stage_id, round_type } of group) {

      const remainingDays = calculateRemainingDays(target_date);
        
      const displayName = typeof name === 'string' && name.trim() ? name : 'Untitled campaign';

      const rawDescription = typeof startup === 'string'
        ? startup
        : (typeof startup?.description === 'string' ? startup.description : '');

      const normalizedDescription = rawDescription.trim();
      const description = normalizedDescription.length > 99 
        ? `${normalizedDescription.slice(0, 99)}...`
        : normalizedDescription;

      const imageUrl =
        (Array.isArray(images)
        && typeof images[0]?.image_url === 'string'
        && (images[0].image_url.trim() ? images[0].image_url : 0))
        || DEFAULT_IMAGE;

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

      const amountInvested = typeof round_totals?.amount_invested === 'number' ? round_totals.amount_invested : 0;   
      const investorCount = typeof round_totals?.investor_count === 'number' ? round_totals.investor_count : 0;
      
      const raisingAmount = typeof raising_amount === 'number' ? raising_amount : 0;  
      const preMoneyValuation = typeof pre_money_valuation === 'number' ? pre_money_valuation : null;
      const externalCommitments = typeof external_commitments === 'number' ? external_commitments : null;
      
      const amountInvestedPercent = (amountInvested != null && amountInvested > 0 && externalCommitments > 0 && raisingAmount > 0) ? Math.round(((externalCommitments + amountInvested) / raisingAmount) * 100 * 10) / 10 : 0;

      const minimumTicket = typeof minimum_ticket === 'number' ? minimum_ticket : null;
      const videoId = typeof video_url === 'string' ? video_url.toLowerCase().trim().replace(/[^0-9A-Za-z_-]/g, '') : null;

      let link = CAMPAIGN_URL_PREFIX;
      if (!isEnglish) link = "/" + locale + CAMPAIGN_URL_PREFIX_RO;

      if (typeof id === 'string') {
        const sanitizedId = id.toLowerCase().trim().replace(/[^0-9A-Za-z_-]/g, '');
        
        if (sanitizedId && sanitizedId.length <= 48) {
          link += "?cid=" + sanitizedId;
        }
      }

      if (roundGroup != "live") link = "";

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
        roundGroup
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
