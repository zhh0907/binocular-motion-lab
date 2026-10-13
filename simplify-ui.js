const $=id=>document.getElementById(id);
function fold(title,nodes,host){
  const d=document.createElement('details'),s=document.createElement('summary');
  d.className='secondary-tools';s.textContent=title;d.append(s);
  const first=nodes.find(Boolean);if(host)host.append(d);else first?.before(d);
  for(const n of nodes)if(n)d.append(n);
  return d;
}
const label=id=>document.querySelector('label[for="'+id+'"]');
export function simplifyUI(){
  const simulator=!!$('eyeFocus');
  if(simulator){
    const controls=$('cameraControls'),start=label('cameraDepth'),nodes=[];
    for(let n=start;n;){nodes.push(n);n=n.nextElementSibling;}
    fold('Camera geometry & smoothing',nodes);
    const placement=label('camY')?.closest('.group');
    if(placement)fold('Camera placement',[placement]);
    $('cameraPanel').querySelector('.muted').textContent='Front: mirror preview. Rear: natural preview. Yellow marker follows your fingertip.';
    const section=$('comparisonPanels');
    const nodesResults=[...section.children].filter(e=>!['eyeFocus','cameraPanel','view','scrub'].includes(e.id));
    fold('Charts & research comparisons',nodesResults);
    const scene=$('view'),sceneFold=fold('Optional 3D scene',[scene]);
    $('source').addEventListener('change',()=>{sceneFold.open=$('source').value!=='camera';});
  }else{
    const formatNodes=[label('recordFormat'),$('recordFormat'),$('formatHint'),$('previewFlip').closest('label')];
    const previewHint=$('previewFlip').closest('label').nextElementSibling;
    if(previewHint?.classList.contains('hint'))formatNodes.push(previewHint);
    fold('Recording & display settings',formatNodes);
    const importNodes=[label('videoFile'),$('videoFile'),$('inputMirrored').closest('label')];
    const hint=$('inputMirrored').closest('label').nextElementSibling;
    if(hint?.classList.contains('hint'))importNodes.push(hint);
    importNodes.push($('fileControls'));fold('Import a video',importNodes);
    const demoNodes=[];for(let n=label('demoScenario');n;){demoNodes.push(n);n=n.nextElementSibling;}
    fold('Synthetic demo',demoNodes);
    const ms=document.querySelector('.measurements');
    fold('Traces & movement evidence',[...ms.children].filter(n=>n.id!=='live'));
    const phaseHint=$('phase').nextElementSibling;if(phaseHint?.classList.contains('hint'))phaseHint.hidden=true;
    const recordHint=document.querySelector('.record-bar')?.nextElementSibling;if(recordHint?.classList.contains('hint'))recordHint.hidden=true;
    $('formatHint').textContent='Original downloads need no conversion. Available formats depend on this browser.';
    $('recordStop').textContent='Finish clip';
    document.querySelector('header p').textContent='Record → Image check → Examiner review';
  }
}
