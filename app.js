'use strict';

/* ─────────────────────────────────────────
   FIXED DATA (never changes between files)
───────────────────────────────────────── */
const FIXED = {
  logo: "logo/logo.png",
  theme: "nature",
  themeGraphics: {
    
    startFrame: "startFrame.jpg",
    playGameFrame: "playGameFrame.jpg",
    textOverly: "textOverly.png",
    bgSet: "bgSet.png",
    drag: "drag.png",
    target: "target.png",
    continueBtn: "continueBtn.png",
    resultsFrame: "resultsFrame.jpg",
    instructionsOverlay: "instructionsOverlay.png",
    green: "green.png",
    yellow: "yellow.png",
    red: "red.png",
    infoImage: "infoImage.png",
    soundOn: "soundOn.png",
    soundOff: "soundOff.png",
    retakeBtn: "retake.png",
    prog_bar_1_bg: "prog_bar_1_bg.png",
    prog_bar_1_step_dark: "prog_bar_1_step_dark.png",
    prog_bar_1_step_correct1: "prog_bar_1_step_correct1.png",
    prog_bar_1_step_correct2: "prog_bar_1_step_correct2.png",
    prog_bar_1_step_wrong: "prog_bar_1_step_wrong.png",
    prog_bar_2_bg: "prog_bar_2_bg.png",
    prog_bar_2_fill: "prog_bar_2_fill.png",
    animation_1: "animation1.webm",
    nature: { font: "'Noto Sans Arabic', sans-serif" },
    history: { font: "Arial, Helvetica, sans-serif" }
  },
  overlay: {
    text: {
      AR: "اسحب المادة وأفلتها في مكانها الصحيح؛ عن طريق الضغط المطول عليها، ثم سحبها إلى المكان المناسب لإفلاتها",
      EN: ""
    }
  },
  note: { AR: "إجابة غير صحيحة", EN: "Wrong answer" },
  continue: { AR: "متابعة", EN: "Continue" },
  feedback_right: {
    AR: ["أحسنت! إجابة صحيحة"],
    EN: ["Well done", "Excellent!", "Correct answer"]
  },
  feedback_wrong: {
    AR: ["حاول مرة أخرى", "إجابة غير صحيحة"],
    EN: ["Try again", "Wrong answer"]
  },
  results: {
    great: {
      title: { AR: "ممتاز", EN: "Excellent" },
      AR: "أحسنت! أداؤك ممتاز ويُظهر فهمًا جيِّدًا لمحتوى الدرس",
      EN: "Excellent! Your performance is outstanding and shows a good understanding of the lesson content."
    },
    goodjob: {
      title: { AR: "جيد جداً", EN: "Very Good" },
      AR: "أداؤك جيّد، و فهمت جزءًا كبيرًا من الدرس. واصل المحاولة لتحسين نتيجتك",
      EN: "Good job! You have a good understanding of the lesson. Keep trying to improve your score."
    },
    fair: {
      title: { AR: "حاول مرة أخرى", EN: "Try Again" },
      AR: "راجع الدرس وجرب من جديد، مع الممارسة سيتحسّن أداؤك",
      EN: "Nice try, review the lesson and try again. With practice, your performance will improve."
    }
  }
};

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
let elementIds = [];    // ordered list of element unique IDs
let optCountMap = {};   // { elUID: number }
let elCounter = 0;      // ever-increasing UID for elements
let optCounter = 0;     // ever-increasing UID for options

/* ─────────────────────────────────────────
   SCROLL HELPER
───────────────────────────────────────── */
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─────────────────────────────────────────
   ADD ELEMENT
───────────────────────────────────────── */
function addElement(prefill = null) {
  elCounter++;
  const uid = 'e' + elCounter;
  elementIds.push(uid);
  optCountMap[uid] = 0;

  const displayNum = elementIds.length;

  // Clone template
  const tmpl = document.getElementById('el-template');
  const clone = tmpl.content.cloneNode(true);
  const card = clone.querySelector('.el-card');

  // Replace placeholder IDs
  card.innerHTML = card.innerHTML
    .replaceAll('ID', uid)
    .replaceAll('NUM', displayNum);

  document.getElementById('elements-container').appendChild(card);

  // Prefill data if provided
  if (prefill) {
    _setVal('q_ar_' + uid, prefill.question?.text?.AR || '');
    _setVal('hint_ar_' + uid, prefill.hint?.AR || '');
    _setVal('sys_hint_ar_' + uid, prefill.system_hint?.AR || '');
    _setVal('answer_' + uid, prefill.answer || 'box_1');
    (prefill.options || []).forEach(o => addOption(uid, o));
  } else {
    // Default 4 empty options
    for (let i = 0; i < 2; i++) addOption(uid);
  }

  updateCounter();
  refreshPreview();
  renumberElements();
  updateAnswerOptions(uid);
}

/* ─────────────────────────────────────────
   REMOVE ELEMENT
───────────────────────────────────────── */
function removeElement(btn) {
  if (!confirm('هل تريد حذف هذا السؤال؟')) return;

  const el = btn.closest(".el-card");
  const id = el.id.replace("el_", "");

  el.remove();

  elementIds = elementIds.filter(e => e !== id);
  delete optCountMap[id];

  renumberElements();
  updateCounter();
  refreshPreview();
}

/* ─────────────────────────────────────────
   TOGGLE COLLAPSE
───────────────────────────────────────── */
function toggleEl(uid) {
  const card = document.getElementById('el_' + uid);
  const btn = card?.querySelector('.toggle-btn');
  if (!card) return;
  card.classList.toggle('collapsed');
  if (btn) btn.textContent = card.classList.contains('collapsed') ? '▼' : '▲';
}

/* ─────────────────────────────────────────
   ADD OPTION
───────────────────────────────────────── */
function addOption(elUid, prefill = null) {
  optCounter++;
  const oid = 'o' + optCounter;
  const container = document.getElementById('options_' + elUid);

  if (container.children.length >= 4) {
    alert("الحد الأقصى 4 اختيارات فقط");
    return;
  }

  const tmpl = document.getElementById('opt-template');
  const clone = tmpl.content.cloneNode(true);
  const row = clone.querySelector('.opt-row');

  row.innerHTML = row.innerHTML
    .replaceAll('ELID', elUid)
    .replaceAll('OID', oid);

  document.getElementById('options_' + elUid)?.appendChild(row);

  if (prefill) {
    _setVal('ol_ar_' + elUid + '_' + oid, prefill.label?.AR || '');
    _setVal('oi_' + elUid + '_' + oid, prefill.img || '');
  }

  refreshPreview();
  updateAnswerOptions(elUid);
}

/* ─────────────────────────────────────────
   REMOVE OPTION
───────────────────────────────────────── */
function removeOption(btn) {

  const container = btn.closest(".options-list");
  if (container.children.length <= 2) {
    alert("لا يمكن حذف الخيارات");
    return;
  }

  btn.closest(".opt-row").remove();
  refreshPreview();
  updateAnswerOptions(elUid);
}

/* ─────────────────────────────────────────
   RENUMBER after deletion
───────────────────────────────────────── */
function renumberElements() {

  const cards = document.querySelectorAll(".el-card");

  cards.forEach((card, index) => {

    const newNum = index + 1;

    // تحديث رقم السؤال
    const numberEl = card.querySelector(".el-number");
    if (numberEl) {
      numberEl.textContent = "سؤال #" + newNum;
    }

    // تحديث element_#
    const badgeEl = card.querySelector(".el-id-badge");
    if (badgeEl) {
      badgeEl.textContent = "element_" + newNum;
    }

  });

}
/* ─────────────────────────────────────────
   COUNTER BADGE
───────────────────────────────────────── */
function updateCounter() {
  const badge = document.getElementById('el-count');
  if (badge) badge.textContent = elementIds.length;
}

function updateAnswerOptions(elUid) {

  const container = document.getElementById("options_" + elUid);
  const select = document.getElementById("answer_" + elUid);

  if (!container || !select) return;

  const count = container.children.length;

  // حفظ القيمة الحالية
  const currentValue = select.value;

  // تفريغ القديم
  select.innerHTML = "";

  // إعادة بناء حسب عدد الخيارات
  for (let i = 1; i <= count; i++) {
    const opt = document.createElement("option");
    opt.value = "box_" + i;
    opt.textContent = "الخيار " + i;
    select.appendChild(opt);
  }

  // إعادة تحديد القيمة لو لسه موجودة
  if ([...select.options].some(o => o.value === currentValue)) {
    select.value = currentValue;
  }
}
/* ─────────────────────────────────────────
   BUILD JSON OBJECT
───────────────────────────────────────── */
function buildJSON(validate = true) {
  const language = _getVal('language').trim();
  const gameTitle = _getVal('gameTitle').trim();

  if (validate) {
    if (!gameTitle) { alert('يرجى إدخال عنوان النشاط.'); return null; }
    if (!language) { alert('يرجى إدخال اللغة.'); return null; }
  }

  const elements = [];
  let valid = true;

document.querySelectorAll(".el-card").forEach((card, idx) => {

  const uid = card.id.replace("el_", "");
  const displayNum = idx + 1;

  const q_ar = card.querySelector('[id^="q_ar_"]').value.trim();
  const hint_ar = card.querySelector('[id^="hint_ar_"]').value.trim();
  const sys_ar = card.querySelector('[id^="sys_hint_ar_"]').value.trim();
  const answerSelect = card.querySelector("select");
  const answer = answerSelect ? answerSelect.value : "";

  const optRows = card.querySelectorAll(".opt-row");
  const options = [];

  optRows.forEach(row => {
    const label_ar = row.querySelector('input').value.trim();

    const fileInput = row.querySelector(".img-file");

    let imgPath = "";

    if (fileInput && fileInput.files.length > 0) {
      const fileName = fileInput.files[0].name;
      imgPath = "pics/" + fileName;
    }

    const opt = {
      label: {
        AR: language === "AR" ? label_ar : "",
        EN: language === "EN" ? label_ar : ""
      }
    };

    if (imgPath) {
      opt.img = imgPath;
    }

    options.push(opt);
  });

  elements.push({
    id: 'element_' + displayNum,
    question: {
      text: {
        AR: language === "AR" ? q_ar : "",
        EN: language === "EN" ? q_ar : ""
      }
    },
    options,
    hint: {
  AR: language === "AR" ? hint_ar : "",
  EN: language === "EN" ? hint_ar : ""
  },

  system_hint: {
    AR: language === "AR" ? sys_ar : "",
    EN: language === "EN" ? sys_ar : ""
  },
    answer
  });

});

  if (!valid) return null;

    return {
    language,
    ...FIXED,
    themeGraphics: {
      ...FIXED.themeGraphics,
      gameTitle: gameTitle
    },
    elements
  };
}

/* ─────────────────────────────────────────
   REFRESH PREVIEW
───────────────────────────────────────── */
function refreshPreview() {
  const el = document.getElementById('json-preview');
  if (!el) return;

  try {
    const data = buildJSON(false);
    if (data) {
      el.innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    el.textContent = '// خطأ في البيانات...';
  }
}

/* ─────────────────────────────────────────
   SYNTAX HIGHLIGHT
───────────────────────────────────────── */
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    match => {
      let cls = 'num';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'key' : 'str';
      } else if (/true|false/.test(match)) {
        cls = 'bool';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

/* ─────────────────────────────────────────
   GENERATE & DOWNLOAD
───────────────────────────────────────── */
function generateJSON() {
  const data = buildJSON(true);
  if (!data) return;

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'game_config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function _getVal(id) {
  return document.getElementById(id)?.value || '';
}
function _setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

/* ─────────────────────────────────────────
   LIVE UPDATE ON ANY INPUT CHANGE
───────────────────────────────────────── */
document.addEventListener('input', e => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    refreshPreview();
  }
});

/* ─────────────────────────────────────────
   INIT — load one sample element
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  refreshPreview();
});
