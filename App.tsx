import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Droplets, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  MessageSquare, 
  Calculator, 
  ClipboardPaste, 
  Info, 
  RefreshCw, 
  SendHorizontal,
  X,
  ImagePlus
} from 'lucide-react';

const App = () => {
  // PDF 변환을 위한 Ref 설정
  const reportRef = useRef(null);

  // 1단계: 향기 파악
  const [preferences, setPreferences] = useState({
    citrus: null, fruity: null, bouquet: null, soap: null, musk: null, vanillaAmber: null
  });

  // 2단계: Formula
  const [step2, setStep2] = useState({ top: '', middle: '', base: '' });

  // AI 프롬프트 관련 상태
  const [userConcept, setUserConcept] = useState('');
  const [copySuccess1, setCopySuccess1] = useState(false);
  const [copySuccess2, setCopySuccess2] = useState(false);

  // 3단계: 브랜드 컨셉
  const [step3, setStep3] = useState({ feature1: '', feature2: '' });

  // 4단계: 레시피 테이블 데이터
  const [step4, setStep4] = useState([
    { id: 1, name: '', ratio: '', ml: '', trait: '' },
    { id: 2, name: '', ratio: '', ml: '', trait: '' },
    { id: 3, name: '', ratio: '', ml: '', trait: '' },
  ]);

  // 붙여넣기 관련 상태
  const [pasteArea, setPasteArea] = useState('');
  const [pasteStatus, setPasteStatus] = useState(null); 

  // 5단계: 이름 설정
  const [step5, setStep5] = useState({ firstName: '', secondName: '' });

  // 6단계: 제품 출시용 이미지 상태
  const [productImage, setProductImage] = useState(null);

  // PDF 라이브러리 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // 1단계 선택 변경 시 2단계 텍스트 자동 업데이트
  useEffect(() => {
    const getSelectedNames = (scents) => {
      const mapping = {
        citrus: '시트러스(Citrus)', fruity: '프루티(Fruity)',
        bouquet: '부케(Bouquet)', soap: '솝(Soap)',
        musk: '머스크(Musk)', vanillaAmber: '바닐라 엠버(Vanilla Amber)'
      };
      return scents
        .filter(key => preferences[key] === 'O')
        .map(key => mapping[key])
        .join(', ');
    };

    setStep2({
      top: getSelectedNames(['citrus', 'fruity']),
      middle: getSelectedNames(['bouquet', 'soap']),
      base: getSelectedNames(['musk', 'vanillaAmber'])
    });
  }, [preferences]);

  // PDF 다운로드 핸들러 (2장에 맞춰서 스케일 정렬)
  const handleDownloadPDF = () => {
    const element = reportRef.current;
    if (!element || !window.html2pdf) return;

    const filename = `${step5.firstName || 'Signature_Fragrance_Report'}.pdf`;
    
    const opt = {
      margin: 0, // 여백을 0으로 강제하여 html2pdf가 정렬을 밀어내지 못하게 고정
      filename: filename,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2.5, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0,
        scrollX: 0,
        x: 0, 
        y: 0, 
        windowWidth: 794 // A4의 가로 폭(210mm)을 픽셀화하여 정확한 비율 캡처 강제
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] } // CSS 내 page-break 규칙 명확히 준수
    };

    window.html2pdf().set(opt).from(element).save();
  };

  const copyToClipboard = (text, setSuccess) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('복사 실패');
    }
    document.body.removeChild(textArea);
  };

  const processPasteData = () => {
    const text = pasteArea.trim();
    if (!text) {
      setPasteStatus('error');
      setTimeout(() => setPasteStatus(null), 2000);
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let rows = lines.map(line => {
      let cells = [];
      if (line.includes('|')) cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
      else if (line.includes(',')) cells = line.split(',').map(c => c.trim());
      else if (line.includes('\t')) cells = line.split('\t').map(c => c.trim());
      else cells = line.split(/\s{2,}/).map(c => c.trim());
      return cells;
    }).filter(cells => 
      cells.length >= 2 && 
      !cells[0].includes('---') && !cells[0].includes('향료') && 
      !cells[0].includes('Note') && !cells[0].includes('합계') && !cells[0].includes('Total')
    );

    if (rows.length > 0) {
      setStep4(rows.map(cells => ({
        id: Math.random(),
        name: cells[0]?.replace(/\*\*|\[|\]/g, '') || '', 
        ratio: cells[1] || '',
        ml: cells[2] || '',
        trait: cells[3] || (cells.length > 3 ? cells.slice(3).join(' ') : '')
      })));
      setPasteStatus('success');
      setPasteArea(''); 
      setTimeout(() => setPasteStatus(null), 2000);
    } else {
      setPasteStatus('error');
      setTimeout(() => setPasteStatus(null), 2000);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const updateRecipe = (id, field, value) => {
    setStep4(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addRow = () => setStep4([...step4, { id: Date.now(), name: '', ratio: '', ml: '', trait: '' }]);
  const removeRow = (id) => setStep4(step4.filter(item => item.id !== id));
  const clearTable = () => setStep4([{ id: 1, name: '', ratio: '', ml: '', trait: '' }]);

  const totalMl = step4.reduce((acc, curr) => {
    const valStr = String(curr.ml || '0');
    const val = valStr.replace(/[^0-9.]/g, '');
    return acc + (parseFloat(val) || 0);
  }, 0).toFixed(1);

  // 프롬프트 정의
  const prompt1 = `당신은 전문 조향사입니다. [노트 구성] 탑: ${step2.top || '(선택안됨)'}, 미들: ${step2.middle || '(선택안됨)'}, 베이스: ${step2.base || '(선택안됨)'}. 컨셉: "${userConcept || '(컨셉 입력 안 됨)'}". 이 향료들의 하모니를 설명하고 브랜드 핵심 특징 2가지를 제안해줘.`;
  
  const prompt2 = `나만의 시그니처 향수의 주요 노트(향료) 레시피를 아래 특징과 선택한 향료를 참고해서 포뮬러를 작성해줘.

[데이터 참고]
- 선택한 향료: ${[step2.top, step2.middle, step2.base].filter(s => s).join(', ') || '시트러스(Citrus), 부케(Bouquet), 머스크(Musk)'}
- 향수 특징 1: ${step3.feature1 || '달콤한 살결의 온기'}
- 향수 특징 2: ${step3.feature2 || '느리게 흐르는 시간'}


[요청 사항]
1. 시그니처 향수의 레시피를 '완제품 10ml' 기준으로 [향료 이름, 비율(%), 10ml기준 실제사용 될 ml 양, 향료의 특징(간단하게)]을 포함한 표로 작성해줘.
2. 내가 구입한 제품은 향료와 베이스가 20:80으로 이미 블렌딩된 상태이므로, 이를 감안하여 사용자가 전체 10ml를 조향할 때 넣어야 할 실제 각 향의 ml양을 계산해줘.
3. 결과는 나중에 붙여넣기 쉽도록 마크다운 표 형식으로 작성해줘.`;

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-8 font-sans text-slate-950">
      {/* UI 상단 바: PDF 저장 시에는 보이지 않음 */}
      <div className="max-w-[210mm] mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden" data-html2canvas-ignore>
        <div>
          <h1 className="text-xl font-black text-blue-900 flex items-center gap-2 tracking-tighter uppercase font-serif italic">
            <Sparkles className="text-blue-500" /> Scent Branding Lab
          </h1>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          className="flex items-center gap-2 bg-slate-950 hover:bg-stone-800 text-white px-8 py-3 rounded-2xl transition-all shadow-xl font-black text-xs active:scale-95"
        >
          <Download size={18} /> 리포트 PDF 저장
        </button>
      </div>

      {/* 리포트 본문: PDF로 저장될 영역 */}
      <main ref={reportRef} className="max-w-[210mm] mx-auto bg-white rounded-3xl shadow-2xl border border-blue-100 print:p-0 print:shadow-none print:border-none pdf-content overflow-hidden">
        
        {/* --- PRINT PAGE 1: 1~3단계 포섭 컨테이너 --- */}
        <div className="pdf-print-page bg-white p-6 md:p-14 flex flex-col">
          <header className="text-center border-b-[3px] border-blue-600 pb-6 mb-8 header-area">
            <h2 className="text-3xl font-black text-slate-950 mb-2 tracking-tighter uppercase font-serif">나만의 향수 브랜딩 리포트</h2>
            <div className="flex justify-center gap-5 text-[10px] text-blue-500 font-black tracking-[0.3em] uppercase">
              <span>Signature Fragrance Design</span>
              <span className="text-blue-200">/</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </header>

          {/* 1단계 */}
          <section className="space-y-4 mb-6 section-item">
            <h3 className="text-base font-black flex items-center gap-3 text-slate-950 uppercase tracking-tight">
              <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-black font-mono">01</span>
              나의 시그니처 향수 파악하기
            </h3>
            <div className="border-y-2 border-blue-600 overflow-hidden bg-white">
              <table className="w-full text-sm text-center border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-blue-950 font-bold border-b border-blue-200">
                    <th className="p-3 w-20 border-r border-blue-200 text-[10px] uppercase tracking-widest">Note</th>
                    <th className="p-3 w-48 border-r border-blue-200 text-left text-[10px] uppercase tracking-widest text-slate-900 font-black">Ingredient (향료)</th>
                    <th className="p-3 text-[10px] uppercase tracking-widest font-black text-blue-800">Preference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50 font-black text-slate-900">
                  {[
                    { cat: 'TOP', items: [['citrus', '1. Citrus (시트러스)'], ['fruity', '2. Fruity (프루티)']] },
                    { cat: 'MID', items: [['bouquet', '3. Bouquet (부케)'], ['soap', '4. Soap (솝)']] },
                    { cat: 'BASE', items: [['musk', '5. Musk (머스크)'], ['vanillaAmber', '6. Vanilla Amber (바닐라 엠버)']] }
                  ].map((group) => (
                    group.items.map((item, idx) => (
                      <tr key={item[0]}>
                        {idx === 0 && <td rowSpan="2" className="bg-blue-50/50 text-slate-900 font-black border-r border-blue-200 text-[10px] tracking-tighter uppercase">{group.cat}</td>}
                        <td className="p-3 border-r border-blue-200 text-left font-black">{item[1]}</td>
                        <td className="p-1">
                          <div className="flex justify-center gap-3">
                            {['O', '△', 'X'].map((val) => (
                              <button 
                                key={val}
                                onClick={() => setPreferences(prev => ({ ...prev, [item[0]]: val }))}
                                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all font-black text-[10px]
                                  ${preferences[item[0]] === val 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'border-blue-100 text-stone-200'}`}
                              >
                                {val === 'O' ? '○' : val === '△' ? '△' : '×'}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2단계 */}
          <section className="space-y-4 mb-6 section-item">
            <h3 className="text-base font-black flex items-center gap-3 text-slate-950 uppercase tracking-tight">
              <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-black font-mono">02</span>
              Formula(조향) 설정
            </h3>
            <div className="border border-blue-200 rounded-3xl overflow-hidden divide-y divide-blue-100 shadow-sm bg-blue-50/5">
              {['TOP', 'MIDDLE', 'BASE'].map((label) => (
                <div key={label} className="flex">
                  <div className="w-20 bg-blue-50 p-4 font-black text-center flex items-center justify-center text-[9px] text-blue-800 tracking-widest border-r border-blue-200 uppercase font-mono">
                    {label}
                  </div>
                  <textarea 
                    className="flex-1 p-3 text-[13px] focus:outline-none focus:bg-white transition-colors resize-none font-black text-slate-950 bg-transparent placeholder:text-stone-200"
                    rows="2"
                    value={step2[label === 'MIDDLE' ? 'middle' : label.toLowerCase()]}
                    onChange={(e) => setStep2({...step2, [label === 'MIDDLE' ? 'middle' : label.toLowerCase()]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* AI 도구 1 (PDF 제외됨) - 03 브랜드 컨셉 설정의 상단으로 배치 이동 */}
          <div data-html2canvas-ignore className="print:hidden space-y-4 mb-6">
            <div className="bg-blue-50/90 border-2 border-blue-200 rounded-[2rem] p-10 shadow-lg transition-all hover:border-blue-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-md"><MessageSquare size={24} /></div>
                <h3 className="text-blue-950 font-black text-xl tracking-tight uppercase tracking-widest">AI Scent Advisor</h3>
              </div>
              <div className="space-y-6">
                <input type="text" className="w-full p-6 rounded-2xl border border-blue-200 shadow-inner focus:ring-4 focus:ring-blue-100 outline-none text-base bg-white text-slate-900 transition-all font-medium placeholder:text-slate-400" placeholder="향수 컨셉 입력 (예: 숲속의 비 개인 새벽 공기)" value={userConcept} onChange={(e) => setUserConcept(e.target.value)} />
                <button onClick={() => copyToClipboard(prompt1, setCopySuccess1)} className={`w-full py-6 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 ${copySuccess1 ? 'bg-emerald-600 text-white shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {copySuccess1 ? <CheckCircle2 size={24} /> : <Copy size={24} />} {copySuccess1 ? '분석 프롬프트 복사 완료!' : '조언 프롬프트 복사하기'}
                </button>
              </div>
            </div>
          </div>

          {/* 3단계 */}
          <section className="space-y-4 mb-6 section-item flex-grow">
            <h3 className="text-base font-bold flex items-center gap-3 text-slate-950 uppercase tracking-tight">
              <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-black font-mono">03</span>
              브랜드 컨셉 설정
            </h3>
            <div className="grid md:grid-cols-2 gap-6 border-2 border-blue-100 rounded-3xl p-8 bg-white shadow-sm">
              {['feature1', 'feature2'].map((f, i) => (
                <div key={f} className="space-y-3">
                  <label className="text-[10px] font-black text-blue-300 uppercase tracking-[0.4em] border-b-2 border-blue-50 pb-2 block font-mono">Identity Point 0{i+1}</label>
                  <textarea className="w-full border-none py-1 bg-transparent focus:outline-none text-[13px] font-black text-slate-950 resize-none h-24 leading-relaxed" placeholder="AI 분석 내용을 적어주세요." value={step3[f]} onChange={(e) => setStep3({...step3, [f]: e.target.value})} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* AI 도구 2 (PDF 제외됨) */}
        <div data-html2canvas-ignore className="print:hidden space-y-4 mb-8 px-6 md:px-14">
          <div className="bg-blue-50/90 border-2 border-blue-200 rounded-[2rem] p-10 shadow-lg transition-all hover:border-blue-300">
            <div className="flex items-center gap-4 mb-8 text-blue-950 font-black text-xl tracking-tight">
              <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-md"><Calculator size={24} /></div>
              상세 레시피(10ml) 생성 요청
            </div>
            <button onClick={() => copyToClipboard(prompt2, setCopySuccess2)} className={`w-full py-6 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 ${copySuccess2 ? 'bg-emerald-600 text-white shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {copySuccess2 ? <CheckCircle2 size={24} /> : <Calculator size={24} />} {copySuccess2 ? '레시피 프롬프트 복사 완료!' : '레시피 생성 프롬프트 복사'}
            </button>
          </div>
          
          {/* AI 데이터 동기화 */}
          <div className="bg-indigo-50/90 border border-indigo-200 rounded-[2.5rem] p-8 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-5 items-stretch relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 text-indigo-950 font-black text-sm uppercase tracking-widest">
                  <ClipboardPaste size={20} className="text-indigo-600" /> AI 표 데이터 동기화
                </div>
                <textarea 
                  className="w-full p-5 text-xs bg-white text-slate-900 border border-indigo-200 rounded-2xl focus:ring-2 focus:ring-indigo-300 outline-none h-20 resize-none font-mono placeholder:text-stone-400 shadow-inner font-bold"
                  placeholder="AI의 결과 표를 복사해서 여기에 붙여넣으세요..."
                  value={pasteArea}
                  onChange={(e) => setPasteArea(e.target.value)}
                />
              </div>
              <button 
                onClick={processPasteData}
                className={`md:w-56 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 text-white
                  ${pasteStatus === 'success' ? 'bg-emerald-600' : pasteStatus === 'error' ? 'bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {pasteStatus === 'success' ? <CheckCircle2 size={28} /> : pasteStatus === 'error' ? <X size={28} /> : <SendHorizontal size={28} />}
                {pasteStatus === 'success' ? '적용 완료' : pasteStatus === 'error' ? '오류' : '데이터 적용'}
              </button>
            </div>
          </div>
        </div>

        {/* --- PRINT PAGE 2: 4~6단계 포섭 컨테이너 --- */}
        <div className="pdf-print-page bg-white p-6 md:p-14 flex flex-col">
          {/* 4단계 */}
          <section className="space-y-4 mb-6 section-item">
            <div className="flex justify-between items-end px-1">
              <h3 className="text-base font-black flex items-center gap-3 text-slate-950 uppercase tracking-tight">
                <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-black font-mono">04</span>
                시그니처 향수 상세 레시피
              </h3>
              <div className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] font-mono">Target: 10ml / 20:80 Solution</div>
            </div>
            
            <div className="overflow-hidden border-2 border-blue-600 rounded-3xl shadow-lg bg-white font-output-table">
              <table className="w-full text-sm text-center border-collapse table-layout-fixed-print">
                <thead>
                  <tr className="bg-blue-50 text-blue-950 font-black uppercase text-[10px] tracking-wider border-b border-blue-100">
                    <th className="p-4 text-left w-[25%] border-r border-blue-200">Ingredient</th>
                    <th className="p-4 w-[15%] border-r border-blue-200">Ratio(%)</th>
                    <th className="p-4 w-[15%] border-r border-blue-200 bg-blue-100 text-blue-950 font-black uppercase">ML</th>
                    <th className="p-4 text-left w-[45%]">Role & Effect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50 font-black text-slate-950">
                  {step4.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="p-0 border-r border-blue-200"><input type="text" className="w-full p-4 bg-transparent border-none focus:ring-0 font-black text-slate-950 text-[12px] truncate" value={row.name} onChange={(e) => updateRecipe(row.id, 'name', e.target.value)} /></td>
                      <td className="p-0 border-r border-blue-200"><input type="text" className="w-full p-4 bg-transparent border-none text-center focus:ring-0 text-stone-500 font-mono text-[12px]" value={row.ratio} onChange={(e) => updateRecipe(row.id, 'ratio', e.target.value)} /></td>
                      <td className="p-0 border-r border-blue-200 bg-blue-50/10"><input type="text" className="w-full p-4 bg-transparent border-none text-center focus:ring-0 font-black text-slate-950 font-mono text-[13px]" value={row.ml} onChange={(e) => updateRecipe(row.id, 'ml', e.target.value)} /></td>
                      <td className="p-0"><input type="text" className="w-full p-4 bg-transparent border-none focus:ring-0 text-xs text-stone-600 italic font-black" value={row.trait} onChange={(e) => updateRecipe(row.id, 'trait', e.target.value)} /></td>
                      <td data-html2canvas-ignore className="p-1 print:hidden text-center"><button onClick={() => removeRow(row.id)} className="text-stone-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 text-blue-950 font-black border-t-2 border-blue-200">
                    <td className="p-4 text-right text-[10px] uppercase tracking-widest text-blue-900/60 font-black">Total</td>
                    <td className="p-4 border-r border-blue-200">100%</td>
                    <td className="p-4 border-r border-blue-200 text-blue-950 font-mono text-lg font-black">{totalMl}ml</td>
                    <td className="p-4 text-left text-[10px] opacity-60 uppercase tracking-widest font-black" colSpan="2">Certified Formula</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 추가 조작 도구 (PDF 제외됨) */}
            <div data-html2canvas-ignore className="print:hidden flex gap-3 mt-4">
              <button onClick={addRow} className="px-5 py-2.5 border-2 border-blue-600 rounded-2xl text-[11px] font-black hover:bg-stone-50 transition-all shadow-sm"><Plus size={16} className="inline mr-2" /> 성분 추가</button>
              <button onClick={clearTable} className="px-5 py-2.5 border border-stone-200 rounded-2xl text-[11px] font-black text-stone-300 hover:bg-stone-50 transition-all"><RefreshCw size={16} className="inline mr-2" /> 초기화</button>
            </div>
          </section>

          {/* 5단계: 이름 설정 */}
          <section className="space-y-4 mb-6 section-item section-name-step">
            <h3 className="text-base font-black flex items-center gap-3 text-slate-950 uppercase tracking-tight">
              <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-black font-mono">05</span>
              나만의 시그니처 향수 이름 설정
            </h3>
            <div className="bg-blue-50/60 border border-blue-200 text-slate-950 p-5 rounded-[1.5rem] flex flex-col justify-center gap-0.5 shadow-md relative overflow-hidden name-box-container">
               <div className="absolute top-0 right-0 p-3 opacity-20"><Droplets size={50} className="text-blue-200" /></div>
               <input className="bg-transparent border-none p-0 text-2xl font-serif font-black focus:ring-0 placeholder:text-stone-300 w-full text-slate-950 tracking-tighter" placeholder="NAME" value={step5.firstName} onChange={(e) => setStep5({...step5, firstName: e.target.value})} />
               <input className="bg-transparent border-none p-0 text-[10px] font-serif italic text-stone-500 focus:ring-0 placeholder:text-stone-300 w-full font-black uppercase tracking-widest" placeholder="SUBTITLE OR SCENT THEME" value={step5.secondName} onChange={(e) => setStep5({...step5, secondName: e.target.value})} />
            </div>
          </section>

          {/* 6단계: 이미지 */}
          <section className="space-y-4 section-item section-image-step flex-grow print:flex-grow-0">
            <h3 className="text-base font-black flex items-center gap-3 text-slate-950 uppercase tracking-tight">
              <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-black font-mono">06</span>
              나만의 시그니처 향수 제품 출시용 이미지
            </h3>
            <div className="relative border-2 border-dashed border-blue-100 rounded-[1.5rem] bg-blue-50/30 flex items-center justify-center overflow-hidden group print:border-none print:bg-white shadow-inner image-box-container">
              {productImage ? (
                <div className="relative h-full w-full flex items-center justify-center p-3">
                  <img src={productImage} className="max-h-full w-auto object-contain rounded-xl shadow-xl bg-white" alt="Design" />
                  <button data-html2canvas-ignore onClick={() => setProductImage(null)} className="absolute top-3 right-3 p-1.5 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all print:hidden shadow-lg"><X size={14} /></button>
                </div>
              ) : (
                <label data-html2canvas-ignore className="cursor-pointer text-center p-8 print:hidden flex flex-col items-center">
                  <ImagePlus size={32} className="text-stone-300 mb-2" />
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-relaxed">AI Generated Art Upload</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
              {!productImage && <div className="hidden print:flex text-blue-300 font-black text-2xl uppercase tracking-[0.8em] opacity-30 font-serif italic">Identity Art</div>}
            </div>
          </section>

          <footer className="pt-8 border-t-2 border-blue-600 mt-auto text-center">
            <p className="text-blue-900 font-serif italic text-base tracking-widest mb-1 font-black uppercase tracking-tighter">The Art of Olfaction by Generative AI</p>
            <p className="text-[9px] text-blue-400 uppercase tracking-[0.6em] font-black font-mono">Career Design Lab — Professional Branding Program — © 2026</p>
          </footer>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&display=swap');
        .font-serif { font-family: 'Noto Serif KR', serif; }
        
        /* 캔버스 화면용 컴팩트 사이즈 설정 (스크린 전용) */
        .image-box-container { min-height: 240px; height: 240px; }
        .name-box-container { height: 75px; }

        /* 화면용 무장애 투명 페이지 래퍼 설정 */
        .pdf-print-page {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        /* 텍스트 가독성 강화 (진하고 선명하게) */
        input, textarea, span, p, th, td {
          color: #0f172a !important; /* Slate-900 */
          -webkit-print-color-adjust: exact;
        }

        /* --- PDF 출력 전용 스타일 (중앙 정렬 및 딱 2장 구성 강제) --- */
        @media print {
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
          }
          .print\\:hidden { display: none !important; visibility: hidden !important; height: 0 !important; }
          
          /* 전체 PDF 캔버스 컨테이너 가로 및 세로 최적화 */
          .pdf-content {
            width: 210mm !important;
            height: auto !important; 
            padding: 0 !important;
            margin: 0 auto !important; /* 수평 중앙정렬 보장 */
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* 정확한 1페이지(1,2,3) & 2페이지(4,5,6) 고정 및 여백 */
          /* 안전성 확보를 위해 높이를 296mm로 아주 미세하게 줄여 3번째 빈 페이지가 생기는 반올림 오차 제거 */
          .pdf-print-page {
            width: 210mm !important;
            height: 296mm !important; /* A4 정규 규격보다 1mm 여유를 주어 빈 3페이지 방지 */
            padding: 10mm 15mm !important; /* 내부 여백 미세 조율 */
            box-sizing: border-box !important;
            page-break-after: always !important; /* 강제 페이지 전환 */
            break-after: page !important;
            overflow: hidden !important; /* 중간에 잘림 및 추가 페이지 밀림 원천 차단 */
            display: flex !important;
            flex-direction: column !important;
            background: white !important;
            margin: 0 !important;
          }

          .pdf-print-page:last-of-type {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* 표 잘림 방지용 고정형 레이아웃 */
          .table-layout-fixed-print {
            table-layout: fixed !important;
            width: 100% !important;
          }
          .table-layout-fixed-print th, 
          .table-layout-fixed-print td {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }

          .header-area { padding-bottom: 3mm !important; margin-bottom: 4mm !important; }
          .section-item { margin-bottom: 3mm !important; }
          h3 { font-size: 13px !important; margin-bottom: 2mm !important; }
          td, th, input, textarea { font-size: 10px !important; line-height: 1.1 !important; }

          .bg-blue-50 { background-color: #eff6ff !important; -webkit-print-color-adjust: exact; }
          .bg-blue-100 { background-color: #dbeafe !important; -webkit-print-color-adjust: exact; }

          /* 5번(이름) 항목 축소 */
          .name-box-container { 
            height: 52px !important; 
            padding: 2mm 3mm !important; 
            border-radius: 10px !important;
            background-color: #eff6ff !important;
            -webkit-print-color-adjust: exact;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .name-box-container input.text-2xl { font-size: 16px !important; }
          .name-box-container input.text-[10px] { font-size: 8px !important; }

          /* 6번(이미지) 항목 축소 */
          .image-box-container { 
            min-height: 145px !important; 
            max-height: 155px !important; 
            height: 150px !important;
            border-radius: 10px !important;
            padding: 0 !important;
            background-color: #eff6ff !important; 
            -webkit-print-color-adjust: exact;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .image-box-container img { max-height: 135px !important; }

          footer { padding-top: 3mm !important; margin-top: auto !important; }
          
          textarea, input { 
            border: none !important; 
            background: transparent !important; 
            font-weight: 900 !important; 
            box-shadow: none !important;
            padding: 2px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;