import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X } from "lucide-react";
import '../Style/LabModal.css';

const LabModal = ({ visitId, isOpen, onClose }) => {
  const [labResults, setLabResults] = useState([]);

  // 시간 포맷팅 함수
  const formatLabTime = (labTime) => {
    if (!labTime) return '-';
    const date = new Date(labTime);
    const year = String(date.getFullYear()).slice(2).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  // 닫기 버튼 핸들러
  const handleCloseClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // 값이 null이나 undefined일 때 '-' 표시
  const formatValue = (value) => {
    return (value !== null && value !== undefined && value !== '') ? value : '-';
  };

  useEffect(() => {
    if (visitId) {
      axios.get(`http://localhost:8081/api/visits/${visitId}/labs`)
        .then(res => {
          console.log("전체 검사 데이터", res.data);
          setLabResults(res.data)
        })
        .catch(err => {
          console.error('검사 결과 불러오기 실패:', err);
          setLabResults([]);
        });
    }
  }, [visitId]);

  return (
    <div className="lab-modal-overlay">
      <div className="lab-modal">
        {/* 제목과 닫기 버튼 같은 줄 */}
        <div className="lab-modal-header">
          <h2>검사 결과</h2>
          <button className="past-close-button" onClick={handleCloseClick}>
            <X className="past-close-icon" />
          </button>
        </div>
        <div className="lab-table-wrapper">
          {labResults.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666',
              fontSize: '16px'
            }}>
              검사 결과가 없습니다.
            </div>
          ) : (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>검사 항목</th>
                  {labResults.map((lab, index) => (
                    <th key={index}>
                      {lab.labTime ? formatLabTime(lab.labTime) : lab.recordTime ? formatLabTime(lab.recordTime) : `#${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Vital Signs */}
                <tr>
                  <td className="test-name">HR</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.hr)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">RR</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.rr)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">SpO2</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.spo2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">SBP</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.sbp)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">DBP</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.dbp)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">BT</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.bt)}</td>
                  ))}
                </tr>
                {/* Lab Results */}
                <tr>
                  <td className="test-name">WBC</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.wbc)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Hb</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.hemoglobin)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">PLT</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.plateletCount)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">RBC</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.redBloodCells)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">ESR</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.sedimentationRate)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Na</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.na)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">K</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.k)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Chloride</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.chloride)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Ca</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ca)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Mg</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.mg)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">BUN</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ureaNitrogen)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Cr</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.creatinine)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">AST</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ast)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">ALT</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.alt)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Bilirubin</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.bilirubin)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Albumin</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.albumin)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">AP</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ap)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">GGT</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ggt)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">LD</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ld)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Ammonia</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ammonia)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Glucose</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.glucose)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Lactate</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.lactate)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Acetone</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.acetone)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">BHB</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.bhb)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">CRP</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.crp)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">PT</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.pt)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">INR(PT)</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.inrPt)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">PTT</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ptt)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">D-Dimer</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.dDimer)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Troponin T</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.troponinT)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">CK</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ck)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">CKMB</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ckmb)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">NT-proBNP</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ntprobnp)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Amylase</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.amylase)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">Lipase</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.lipase)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">pH</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ph)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">PCO2</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.pco2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">PO2</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.po2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">ctCO2</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.ctco2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="test-name">BCB</td>
                  {labResults.map((lab, index) => (
                    <td key={index}>{formatValue(lab.bcb)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabModal;