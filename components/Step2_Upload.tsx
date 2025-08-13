import React, { useState, useCallback } from 'react';
import type { DataRow } from '../types';
import * as XLSX from 'xlsx';

interface Step2Props {
  populationSize: number;
  onUpload: (data: DataRow[], headers: string[]) => void;
  onBack: () => void;
  onNext: () => void;
  dataExtractionInfo: string;
  onDataExtractionInfoChange: (info: string) => void;
}

const Step2_Upload: React.FC<Step2Props> = ({ populationSize, onUpload, onBack, onNext, dataExtractionInfo, onDataExtractionInfoChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [parsedData, setParsedData] = useState<DataRow[]>([]);
  const [preview, setPreview] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [hasHeader, setHasHeader] = useState(true);

  const parseCSV = useCallback((csvText: string, hasHeaderRow: boolean): { data: DataRow[], headers: string[] } => {
    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) throw new Error("O arquivo está vazio.");

    const delimiter = /;/.test(lines[0]) ? ';' : ',';
    
    let fileHeaders: string[];
    let dataLines: string[];

    if (hasHeaderRow) {
      if (lines.length < 2) throw new Error("O arquivo com cabeçalho precisa ter pelo menos uma linha de dados.");
      fileHeaders = lines[0].trim().split(delimiter).map(h => h.trim().replace(/"/g, ''));
      dataLines = lines.slice(1);
    } else {
      const firstLineCols = lines[0].trim().split(delimiter).length;
      fileHeaders = Array.from({ length: firstLineCols }, (_, i) => `Coluna ${i + 1}`);
      dataLines = lines;
    }
    
    const data = dataLines.map(line => {
      const values = line.trim().split(delimiter);
      const row: DataRow = {};
      fileHeaders.forEach((header, i) => {
        const value = values[i]?.trim().replace(/"/g, '') || '';
        row[header] = isNaN(Number(value)) || value === '' || /\s/.test(value) ? value : Number(value);
      });
      return row;
    });

    return { data, headers: fileHeaders };
  }, []);


  const handleDataParsed = useCallback((data: DataRow[], headers: string[]) => {
      if (data.length !== populationSize) {
        setError(`Atenção: O arquivo contém ${data.length} linhas de dados, mas a população informada foi de ${populationSize}. Por favor, verifique.`);
      } else {
        setError(''); // Clear previous error if count matches.
      }
      setParsedData(data);
      setPreview(data.slice(0, 5));
      setHeaders(headers);
      onUpload(data, headers);
  }, [populationSize, onUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setParsedData([]);
    setPreview([]);
    setHeaders([]);
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      const fileNameLower = selectedFile.name.toLowerCase();
      if (!fileNameLower.endsWith('.csv') && !fileNameLower.endsWith('.txt') && !fileNameLower.endsWith('.xlsx')) {
         setError('Tipo de arquivo inválido. Por favor, use .xlsx, .csv ou .txt.');
         return;
      }

      setFile(selectedFile);
      const reader = new FileReader();

      if (fileNameLower.endsWith('.xlsx')) {
        reader.onload = (event) => {
          try {
            const binaryStr = event.target?.result;
            const workbook = XLSX.read(binaryStr, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            let jsonData: DataRow[];
            let fileHeaders: string[];
            
            if (hasHeader) {
                jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet);
                if (jsonData.length > 0) {
                    fileHeaders = Object.keys(jsonData[0]);
                } else {
                    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
                    const headersFromSheet = [];
                    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
                        const cell = worksheet[XLSX.utils.encode_cell({r: headerRange.s.r, c: C})];
                        headersFromSheet.push(cell ? cell.v : `Coluna ${C + 1}`);
                    }
                    fileHeaders = headersFromSheet;
                }
            } else {
                const arrayOfArrays = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
                if (arrayOfArrays.length === 0) {
                    handleDataParsed([], []);
                    return;
                }
                fileHeaders = Array.from({ length: arrayOfArrays[0].length }, (_, i) => `Coluna ${i + 1}`);
                jsonData = arrayOfArrays.map(rowArray => {
                    const row: DataRow = {};
                    fileHeaders.forEach((header, i) => {
                       const value = rowArray[i] ?? '';
                       row[header] = isNaN(Number(value)) || value === '' || (typeof value === 'string' && /\s/.test(value)) ? value : Number(value);
                    });
                    return row;
                });
            }

            handleDataParsed(jsonData, fileHeaders);
          } catch (err: any) {
            setError(`Erro ao processar arquivo Excel: ${err.message}`);
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            const { data, headers } = parseCSV(text, hasHeader);
            handleDataParsed(data, headers);
          } catch (err: any) {
            setError(err.message);
          }
        };
        reader.readAsText(selectedFile, 'UTF-8');
      }
    }
  }, [handleDataParsed, parseCSV, hasHeader]);
  
  const isNextDisabled = parsedData.length !== populationSize || dataExtractionInfo.trim() === '';

  const getButtonTitle = () => {
    const reasons = [];
    if (!file) {
        return 'É necessário carregar um arquivo de dados.';
    }
    if (parsedData.length !== populationSize) {
      reasons.push('o arquivo carregado não corresponde ao tamanho da população');
    }
    if (dataExtractionInfo.trim() === '') {
      reasons.push('a fonte dos dados não foi preenchida');
    }
    if (reasons.length > 0) {
      return `Não é possível avançar porque ${reasons.join(' e ')}.`;
    }
    return 'Avançar para a próxima etapa';
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl animate-fade-in">
      <h2 className="text-2xl font-bold text-[#0033C6] mb-6">📂 Etapa 2: Upload da Base de Dados</h2>
      <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-[#0033C6]">Clique para fazer o upload</span> ou arraste o arquivo</p>
          <p className="text-xs text-gray-500">.XLSX, .CSV, .TXT</p>
        </label>
        <input id="file-upload" name="file-upload" type="file" className="hidden" accept=".xlsx,.csv,.txt" onChange={handleFileChange} />
         <div className="flex items-center space-x-2 mt-4">
          <input type="checkbox" id="hasHeader" name="hasHeader" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="h-4 w-4 text-[#0033C6] focus:ring-[#0033C6] border-gray-300 rounded" />
          <label htmlFor="hasHeader" className="text-sm text-gray-600 font-medium">A primeira linha contém cabeçalho</label>
        </div>
      </div>

      {file && <p className="text-center mt-4 text-gray-600">Arquivo selecionado: <span className="font-bold">{file.name}</span></p>}
      
      {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}

      <div className="w-full mt-6">
        <label htmlFor="dataExtractionInfo" className="block text-sm font-bold text-gray-700 mb-1">
            Fonte e Preparação dos Dados <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
            (Campo obrigatório) Descreva a fonte dos dados, filtros aplicados, responsável pela extração e outras informações relevantes para a rastreabilidade.
        </p>
        <textarea
            id="dataExtractionInfo"
            rows={4}
            value={dataExtractionInfo}
            onChange={(e) => onDataExtractionInfoChange(e.target.value)}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0033C6] ${!dataExtractionInfo.trim() ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="Ex: Base extraída do SAP (transação FBL5N) em DD/MM/AAAA por [Nome do Responsável], filtrando por clientes ativos no último ano. A base original continha X linhas e foi limpa para remover duplicatas."
            required
        />
    </div>

      {preview.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-lg text-gray-800 mb-2">🔍 Preview da base (5 primeiras linhas)</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                <tr>
                  {headers.map(h => <th key={h} className="px-4 py-2 font-bold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    {headers.map(h => <td key={h} className="px-4 py-2 truncate max-w-xs">{String(row[h])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300">
          Voltar
        </button>
        <button 
            onClick={onNext}
            disabled={isNextDisabled}
            title={getButtonTitle()}
            className="px-8 py-3 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
            Próximo: Tipo de Amostragem
        </button>
      </div>
    </div>
  );
};

export default Step2_Upload;