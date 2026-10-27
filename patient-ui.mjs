import {createLibrary, validateLibrary, generatePatients, mergeLibraries, findPatient, PatientLayer, MODEL_VERSION} from './patient-model.mjs';

const STORAGE_KEY='binocular-motion-patients-v1';
const titles={conjugate:'Both eyes · One gaze direction',adduction:'One eye · Inward movement',abduction:'One eye · Outward movement'};
export function downloadJSON(value, filename) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function mountPatientControls({onChange}) {
  const $=id=>document.getElementById(id);
  const host=document.createElement('section');host.id='patientControls';host.className='group patient-controls';
  host.innerHTML=`<h2>Virtual patients</h2>
    <p class="help">Choose a pattern and side, generate a library, then activate any patient by number. Parameters stay fixed until you select another patient.</p>
    <label for="patientTemplate">Abnormal movement pattern</label>
    <select id="patientTemplate"><option value="conjugate">Both eyes · One gaze direction</option><option value="adduction">One eye · Inward movement</option><option value="abduction">One eye · Outward movement</option></select>
    <label id="patientSideLabel" for="patientSide">Limited gaze direction</label>
    <select id="patientSide"><option value="left">Left</option><option value="right">Right</option></select>
    <p class="help">Left/right refers to the simulated person, not the mirrored screen. Horizontal effects also apply during diagonal and depth motion; vertical motion is unchanged.</p>
    <label for="patientCount">Number of patients (1–1000)</label><input id="patientCount" type="number" min="1" max="1000" step="1" value="30">
    <label for="patientSeed">Batch seed (saved with each patient)</label><div class="row"><input id="patientSeed" type="text" maxlength="100" autocomplete="off"><button id="patientNewSeed" type="button">New seed</button></div>
    <button id="patientGenerate" type="button">Generate &amp; append patients</button>
    <p id="patientLibrarySummary" class="help"></p>
    <label for="patientNumber">Patient number or ID</label><div class="row"><input id="patientNumber" type="text" list="patientIds" placeholder="1 or P000001" autocomplete="off"><button id="patientApply" type="button">Activate</button></div><datalist id="patientIds"></datalist>
    <div class="row"><button id="patientPrevious" type="button">Previous</button><button id="patientNext" type="button">Next</button></div>
    <p id="patientActive" class="patient-active"></p><button id="patientDisable" type="button">Use normal reference</button>
    <details><summary>Fixed parameters &amp; sampling</summary><pre id="patientDetails"></pre><p class="help">Three equally spaced capacity strata receive nearly equal counts. These are engineering exploration ranges, not clinical severity or NIHSS labels. Response speed is fixed in v1.</p></details>
    <button id="patientExport" type="button">Export patient library (JSON)</button>
    <label for="patientImport">Restore / merge a library (JSON)</label><input id="patientImport" type="file" accept=".json,application/json">
    <p class="help">Libraries persist in this browser. Export a backup to move to another device. Import preserves IDs and rejects conflicts; it never silently renumbers patients.</p>
    <button id="patientRunExport" type="button">Export current run + patient (JSON)</button>
    <p id="patientMessage" class="help" role="status" aria-live="polite"></p><p id="patientStorage" class="help"></p>
    <p class="help">Candidate movements for clinician review. No NIHSS scores are generated. <a href="./patient-guide.html" target="_blank" rel="noopener">Patient guide &amp; mathematics ↗</a></p>`;
  $('cameraControls').before(host);
  const badge=document.createElement('div');badge.id='patientBadge';badge.className='patient-badge';$('eyeFocus').append(badge);
  let library=createLibrary(crypto.randomUUID()), active=null, storageWarning='', corrupt=false;
  let stored=null;
  try {stored=localStorage.getItem(STORAGE_KEY);}
  catch {storageWarning='Browser storage is unavailable. Export JSON before closing this tab.';}
  if(stored)try {
      const raw=stored;
      const saved=JSON.parse(raw);library=validateLibrary(saved.library);
      active=saved.activeId?findPatient(library,saved.activeId):null;
      if(saved.activeId&&!active)throw Error('Saved active ID is missing.');
      storageWarning='Restored from this browser. Export JSON for a portable backup.';
  } catch(error) {
    // Do not overwrite an unreadable or incompatible library with an empty one.
    corrupt=true;active=null;
    storageWarning='Saved library could not be restored; it has not been overwritten. Import a valid backup to recover. '+error.message;
  }
  const layer=new PatientLayer(active);
  if(active)$('patientNumber').value=active.id;
  function message(value,error=false){$('patientMessage').textContent=value;$('patientMessage').classList.toggle('error',error);}
  function save() {
    if(corrupt)return;
    try {
      // Refuse to overwrite changes made by a different tab. Export remains available.
      const latest=localStorage.getItem(STORAGE_KEY);
      if(latest!==stored){storageWarning='Another tab changed the saved library. This tab has not overwritten it. Export this tab’s library, then reload to synchronize.';return;}
      const next=JSON.stringify({library,activeId:active?.id||null});
      localStorage.setItem(STORAGE_KEY,next);stored=next;storageWarning='Saved in this browser. Export JSON for a portable backup.';
    }
    catch { storageWarning='Browser storage is unavailable or full. Patients work in this tab only; export the library before closing.'; }
  }
  function render() {
    $('patientLibrarySummary').textContent=`${library.patients.length} fixed patients · Library ${library.libraryId}`;
    $('patientStorage').textContent=storageWarning||'New library; generate patients to save it in this browser.';
    $('patientGenerate').disabled=corrupt;$('patientApply').disabled=corrupt||!library.patients.length;
    $('patientExport').disabled=corrupt||!library.patients.length;
    const index=active?library.patients.findIndex(p=>p.id===active.id):-1;
    $('patientPrevious').disabled=corrupt||index<=0;$('patientNext').disabled=corrupt||!library.patients.length||index>=library.patients.length-1;
    $('patientDisable').disabled=!active;
    $('patientActive').textContent=active?`${active.id} · ${titles[active.template]} · ${active.side}`:'Normal reference · No patient layer';
    badge.textContent=active?`Virtual patient ${active.id} · ${active.side}`:'Normal reference';
    $('patientDetails').textContent=active?JSON.stringify(active,null,2):'No patient selected.';
    $('patientIds').replaceChildren(...library.patients.map(p=>{const option=document.createElement('option');option.value=p.id;return option;}));
  }
  function activate(patient) {
    active=patient;layer.setPatient(patient);if(patient)$('patientNumber').value=patient.id;
    save();render();onChange();
  }
  function attempt(fn){try{fn();}catch(error){message(error.message,true);}}
  $('patientTemplate').onchange=()=>$('patientSideLabel').textContent=$('patientTemplate').value==='conjugate'?'Limited gaze direction':'Affected eye';
  $('patientNewSeed').onclick=()=>$('patientSeed').value=crypto.randomUUID();$('patientNewSeed').click();
  $('patientGenerate').onclick=()=>attempt(()=>{
    if(corrupt)throw Error('Restore a valid library before generating patients.');
    const oldCount=library.patients.length;
    library=generatePatients(library,{count:Number($('patientCount').value),template:$('patientTemplate').value,side:$('patientSide').value,seed:$('patientSeed').value});
    activate(library.patients[oldCount]);
    message(`Added ${library.patients.length-oldCount} fixed patients (${library.patients[oldCount].id}–${library.patients.at(-1).id}). First patient activated; current run restarted.`);
  });
  $('patientApply').onclick=()=>attempt(()=>{
    const patient=findPatient(library,$('patientNumber').value);if(!patient)throw Error('Patient ID not found. Generate or import its library first.');
    activate(patient);message(`${patient.id} activated. Same parameters; current run restarted from neutral state.`);
  });
  $('patientNumber').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('patientApply').click();}});
  $('patientDisable').onclick=()=>{activate(null);message('Normal reference activated; current run restarted. Saved patients are unchanged.');};
  for(const [id,offset] of [['patientPrevious',-1],['patientNext',1]])$(id).onclick=()=>{
    const index=active?library.patients.findIndex(p=>p.id===active.id):-1;
    const patient=library.patients[index+offset];if(patient)activate(patient);
  };
  $('patientExport').onclick=()=>downloadJSON(library,`patients-${library.libraryId}.json`);
  $('patientImport').onchange=async()=>{
    const file=$('patientImport').files?.[0];if(!file)return;
    try {
      if(file.size>5*1024*1024)throw Error('Patient library must be smaller than 5 MiB.');
      const incoming=validateLibrary(JSON.parse(await file.text()));
      library=corrupt?incoming:mergeLibraries(library,incoming);corrupt=false;
      activate(active&&findPatient(library,active.id)||null);
      message(`Library restored: ${library.patients.length} fixed patients. Enter an ID to activate.`);
    }catch(error){message(error.message,true);}
    finally{$('patientImport').value='';}
  };
  render();
  return {layer, get active(){return active;}, get library(){return library;},
    get provenance(){return {libraryId:library.libraryId,patient:active?{...active}:null,modelVersion:MODEL_VERSION};}};
}
