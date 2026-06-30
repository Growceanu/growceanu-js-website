const API_BASE_URL = 'https://api.staging.growceanu.com/api/rest/';
const DEFAULT_IMAGE = 'https://cdn.prod.website-files.com/68b050fbb5db71e378de9264/693000c423b43158575a083f_campaign-placeholder.svg';
const CAMPAIGN_CONTAINER_ID = 'single-campaign-container';
const CAMPAIGN_OPEN_STAGE_ID = '06909c7c-e94a-40de-8903-d8127e6e604d';
const CAMPAIGN_INVEST_URL_PREFIX = 'https://investors-staging.growceanu.com/startup/'; 

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
    const path = isEnglish ? '/investors-oportunities' : `/${locale}/investors-oportunities`;
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

function populateCampaignInfo(card, { name, imageUrl, remainingDays, description, amountInvested, amountInvestedPercent, preMoneyValuation, postMoneyValuation, externalCommitments, growceanuTargetRound, investorCount, raisingAmount, minimumTicket, maxTicket, videoId, displayTags, link, longDescription, campaignOpen, campaignType, targetDate }) {
	
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

  [
    ['.campaign-title', name],
    ['.campaign-type', campaignType],
    ['.campaign-target-date', targetDate],
  ].forEach(([sel, val]) => setTextAll(card, sel, val));

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
  
  const showExternalCommitments = Number.isFinite(externalCommitments) && externalCommitments > 0;
  setTextAll(card, '.campaign-external-commitments', showExternalCommitments ? "€" + externalCommitments : '-');
  
  const showGrowceanuTargetRound = Number.isFinite(growceanuTargetRound) && growceanuTargetRound > 0;
  setTextAll(card, '.campaign-growceanu-target-round', showGrowceanuTargetRound ? "€" + growceanuTargetRound : '-');
  
  const showAmountInvested = Number.isFinite(amountInvested) && amountInvested > 0;
  setTextAll(card, '.campaign-amount-invested', showAmountInvested ? "€" + amountInvested : '-');
  
  const showPreValuation = Number.isFinite(preMoneyValuation) && preMoneyValuation > 0;
  setTextAll(card, '.campaign-valuation-pre-full', showPreValuation ? "€" + preMoneyValuation : '-');
  setText(card, '.campaign-valuation', showPreValuation ? "€" + formatNumberToUnit(preMoneyValuation) : '');
  setHidden(card, '.campaign-box-valuation', !showPreValuation);
    
  const showPostValuation = Number.isFinite(postMoneyValuation) && postMoneyValuation > 0;
  setTextAll(card, '.campaign-valuation-post-full', showPostValuation ? "€" + postMoneyValuation : '-');



  const showMinimum = Number.isFinite(minimumTicket) && minimumTicket > 0;
  setTextAll(card, '.campaign-min-invest', showMinimum ? "€" + minimumTicket : '');
  setHidden(card, '.campaign-min-invest', !showMinimum);

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
    const path = isEnglish ? '/investors-oportunities' : `/${locale}/investors-oportunities`;
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
    video_url, 
    tags, 
    raising_amount, 
    pre_money_valuation, post_money_valuation,
    external_commitments,
    growceanu_target_round,
    idea, 
    id, 
    stage_id, 
    round_type,
    max_ticket,
    }] = rounds;

    const remainingDays = calculateRemainingDays(target_date);
    const targetDate = formatDate(target_date);
			
    const displayName = typeof name === 'string' && name.trim() ? name : 'Untitled campaign';

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
    const postMoneyValuation = typeof post_money_valuation === 'number' ? post_money_valuation : null;
    const externalCommitments = typeof external_commitments === 'number' ? external_commitments : null;
    const growceanuTargetRound = typeof growceanu_target_round === 'number' ? growceanu_target_round : null;


    const amountInvestedPercent = (amountInvested != null && amountInvested > 0 && externalCommitments > 0 && raisingAmount > 0) ? Math.round(((externalCommitments + amountInvested) / raisingAmount) * 100 * 10) / 10 : 0;

    const minimumTicket = typeof minimum_ticket === 'number' ? minimum_ticket : null;
    const maxTicket = typeof max_ticket === 'number' ? max_ticket : null;

    const videoId = typeof video_url === 'string' ? video_url.toLowerCase().trim().replace(/[^0-9A-Za-z_-]/g, '') : null;

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

const extractCid = () =>
{
  const search = typeof window?.location?.search === 'string' ? window.location.search : '';
  if (!search)
  {
    return null;
  }

  const cidParam = new URLSearchParams(search).get('cid');
  if (typeof cidParam !== 'string')
  {
    return null;
  }

  const cleaned = cidParam.toLowerCase().trim().replace(/[^0-9A-Za-z_-]/g, '');
  if (!cleaned)
  {
    return null;
  }

  return cleaned.slice(0, 48);
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

(function () {

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
