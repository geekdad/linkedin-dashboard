import React, { useState, ChangeEvent, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceArea } from 'recharts';
import { format, parseISO, parse, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface ImpressionData {
  date: string;
  impressions: number;
  url: string;
}

interface EngagementData {
  date: string;
  engagement: number;
  url: string;
}

const sampleImpressionsData: ImpressionData[] = [
  { date: '2023-05-01', impressions: 1000, url: 'https://example.com/post1' },
  { date: '2023-05-02', impressions: 1200, url: 'https://example.com/post2' },
  { date: '2023-05-03', impressions: 800, url: 'https://example.com/post3' },
  { date: '2023-05-04', impressions: 1500, url: 'https://example.com/post4' },
  { date: '2023-05-05', impressions: 2000, url: 'https://example.com/post5' },
];

const sampleEngagementData: EngagementData[] = [
  { date: '2023-05-01', engagement: 65, url: 'https://example.com/post1' },
  { date: '2023-05-02', engagement: 103, url: 'https://example.com/post2' },
  { date: '2023-05-03', engagement: 157, url: 'https://example.com/post3' },
  { date: '2023-05-04', engagement: 81, url: 'https://example.com/post4' },
  { date: '2023-05-05', engagement: 117, url: 'https://example.com/post5' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].value > 0) {
    return (
      <div className="bg-white border border-gray-300 p-2 shadow-md">
        <p className="font-bold">{`Date: ${format(parseISO(label), 'MMM d, yyyy')}`}</p>
        <p>{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const CustomEngagementTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].value > 0) {
    return (
      <div className="bg-white border border-gray-300 p-2 shadow-md">
        <p className="font-bold">{`Date: ${format(parseISO(label), 'MMM d, yyyy')}`}</p>
        <p>{`Engagements: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload, totalEngagements }: any) => {
  if (active && payload && payload.length) {
    const engagementValue = payload[0].value;
    const percentage = ((engagementValue / totalEngagements) * 100).toFixed(1);
    const date = payload[0].payload.date ? format(parseISO(payload[0].payload.date), 'MMM d, yyyy') : 'N/A';
    return (
      <div className="bg-white border border-gray-300 p-2 shadow-md">
        <p>{`Date: ${date}`}</p>
        <p>{`Engagements: ${engagementValue}`}</p>
        <p>{`Percentage: ${percentage}%`}</p>
      </div>
    );
  }
  return null;
};

export default function LinkedInDashboard() {
  const [impressionsData, setImpressionsData] = useState<ImpressionData[]>(sampleImpressionsData);
  const [zoomedImpressionsData, setZoomedImpressionsData] = useState<ImpressionData[]>(sampleImpressionsData);
  const [engagementData, setEngagementData] = useState<EngagementData[]>(sampleEngagementData);
  const [zoomedEngagementData, setZoomedEngagementData] = useState<EngagementData[]>(sampleEngagementData);
  const [engagementDistribution, setEngagementDistribution] = useState<{ name: string; value: number; date: string; url: string }[]>([]);

  const [impressionsZoomDomain, setImpressionsZoomDomain] = useState<{ start: string; end: string } | null>(null);
  const [engagementZoomDomain, setEngagementZoomDomain] = useState<{ start: string; end: string } | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<string | number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | number | null>(null);
  const [activeChart, setActiveChart] = useState<'impressions' | 'engagement' | null>(null);

  const [totalEngagements, setTotalEngagements] = useState<number>(0);

  useEffect(() => {
    const newDistribution = engagementData.map(item => ({
      name: item.url,
      value: item.engagement,
      date: item.date,
      url: item.url
    }));
    setEngagementDistribution(newDistribution);

    const total = engagementData.reduce((sum, item) => sum + item.engagement, 0);
    setTotalEngagements(total);
  }, [engagementData]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>, dataType: 'impressions' | 'engagement') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsedData = parseCSV(content);
          console.log('Parsed CSV data:', parsedData);
          if (parsedData.length === 0) {
            console.error('No valid data found in the CSV file');
            return;
          }
          if (dataType === 'impressions') {
            const formattedData = parsedData.map((item: any) => {
              const date = parse(item['Post publish date'], 'M/d/yyyy', new Date());
              return {
                date: format(date, 'yyyy-MM-dd'),
                impressions: parseInt(item['Impressions'], 10),
                url: item['Post URL']
              };
            });
            
            // Sort the formatted data by date in ascending order
            const sortedData = formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            // Generate a complete date range
            const startDate = parseISO(sortedData[0].date);
            const endDate = parseISO(sortedData[sortedData.length - 1].date);
            const allDates = eachDayOfInterval({ start: startDate, end: endDate });
            
            // Create a complete dataset with 0 impressions for missing dates
            const completeData = allDates.map(date => {
              const existingData = sortedData.find(d => d.date === format(date, 'yyyy-MM-dd'));
              return existingData || { date: format(date, 'yyyy-MM-dd'), impressions: 0, url: '' };
            });

            console.log('Complete impressions data:', completeData);
            setImpressionsData(completeData);
            setZoomedImpressionsData(completeData);
            setImpressionsZoomDomain(null);
          } else if (dataType === 'engagement') {
            const formattedData = parsedData.map((item: any) => {
              const date = parse(item['Post publish date'], 'M/d/yyyy', new Date());
              const engagementValue = parseInt(item['Engagements'], 10);
              console.log('Raw engagement value:', item['Engagements']);
              console.log('Parsed engagement value:', engagementValue);
              return {
                date: format(date, 'yyyy-MM-dd'),
                engagement: isNaN(engagementValue) ? 0 : engagementValue,
                url: item['Post URL']
              };
            });
            
            // Sort the formatted data by date in ascending order
            const sortedData = formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            // Generate a complete date range
            const startDate = parseISO(sortedData[0].date);
            const endDate = parseISO(sortedData[sortedData.length - 1].date);
            const allDates = eachDayOfInterval({ start: startDate, end: endDate });
            
            // Create a complete dataset with 0 engagement for missing dates
            const completeData = allDates.map(date => {
              const existingData = sortedData.find(d => d.date === format(date, 'yyyy-MM-dd'));
              return existingData || { date: format(date, 'yyyy-MM-dd'), engagement: 0, url: '' };
            });

            console.log('Complete engagement data:', completeData);
            setEngagementData(completeData);
            setZoomedEngagementData(completeData);
            setEngagementZoomDomain(null);
          }
        } catch (error) {
          console.error('Error parsing CSV file:', error);
        }
      };
      reader.onerror = (error) => console.error('Error reading file:', error);
      reader.readAsText(file);
    }
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj: any, header, index) => {
        const value = values[index];
        obj[header] = value ? value.trim() : '';
        return obj;
      }, {});
    }).filter(obj => Object.values(obj).some(val => val !== ''));
  };

  const handleMouseDown = (e: any, chartType: 'impressions' | 'engagement') => {
    if (e && e.activeLabel) {
      setRefAreaLeft(e.activeLabel);
      setActiveChart(chartType);
    }
  };

  const handleMouseMove = (e: any) => {
    if (refAreaLeft && e && e.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (refAreaLeft && refAreaRight) {
      if (activeChart === 'impressions') {
        let [left, right] = [refAreaLeft, refAreaRight].sort((a: any, b: any) => a.localeCompare(b));
        const startDate = parseISO(left as string);
        const endDate = parseISO(right as string);

        const zoomedData = impressionsData.filter(item => {
          const itemDate = parseISO(item.date);
          return isWithinInterval(itemDate, { start: startDate, end: endDate });
        });

        setZoomedImpressionsData(zoomedData);
        setImpressionsZoomDomain({ start: left as string, end: right as string });
      } else if (activeChart === 'engagement') {
        let [left, right] = [refAreaLeft, refAreaRight].sort((a: any, b: any) => a.localeCompare(b));
        const startDate = parseISO(left as string);
        const endDate = parseISO(right as string);

        const zoomedData = engagementData.filter(item => {
          const itemDate = parseISO(item.date);
          return isWithinInterval(itemDate, { start: startDate, end: endDate });
        });

        setZoomedEngagementData(zoomedData);
        setEngagementZoomDomain({ start: left as string, end: right as string });
      }
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setActiveChart(null);
  };

  const handleZoomOut = (chartType: 'impressions' | 'engagement') => {
    if (chartType === 'impressions') {
      setImpressionsZoomDomain(null);
      setZoomedImpressionsData(impressionsData);
    } else if (chartType === 'engagement') {
      setEngagementZoomDomain(null);
      setZoomedEngagementData(engagementData);
    }
  };

  const getUniqueMonthTicks = (data: any[]) => {
    const uniqueMonths = new Set();
    return data.filter(item => {
      const month = item.date.substring(0, 7); // Get YYYY-MM
      if (!uniqueMonths.has(month)) {
        uniqueMonths.add(month);
        return true;
      }
      return false;
    }).map(item => item.date);
  };

  const handleBarClick = (data: any) => {
    if (data && data.url) {
      window.open(data.url, '_blank');
    }
  };

  const handlePieClick = (data: any) => {
    if (data && data.payload && data.payload.url) {
      window.open(data.payload.url, '_blank');
    }
  };

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-6">LinkedIn Analytics Dashboard</h1>
      
      <div className="flex justify-center space-x-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileUpload(e, 'impressions')}
            style={{ display: 'none' }}
            id="impressions-upload"
          />
          <label 
            htmlFor="impressions-upload" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer inline-block"
          >
            Upload Impressions Data
          </label>
        </div>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileUpload(e, 'engagement')}
            style={{ display: 'none' }}
            id="engagement-upload"
          />
          <label 
            htmlFor="engagement-upload" 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer inline-block"
          >
            Upload Engagement Data
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Impressions by Post</h2>
        <button 
          onClick={() => handleZoomOut('impressions')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Zoom Out
        </button>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart 
              data={zoomedImpressionsData}
              onMouseDown={(e) => handleMouseDown(e, 'impressions')}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => format(parseISO(tick), 'MMM')}
                ticks={getUniqueMonthTicks(zoomedImpressionsData)}
                type="category"
                allowDataOverflow
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis 
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="impressions" 
                fill="#82ca9d"
                isAnimationActive={false}
                onClick={handleBarClick}
                shape={(props: any) => {
                  const { x, y, width, height, value } = props;
                  return (
                    <rect 
                      x={x} 
                      y={y} 
                      width={width} 
                      height={height} 
                      fill={value > 0 ? "#82ca9d" : "transparent"} 
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }}
              />
              {refAreaLeft && refAreaRight && activeChart === 'impressions' && (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Engagement by Post</h2>
        <button 
          onClick={() => handleZoomOut('engagement')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Zoom Out
        </button>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart 
              data={zoomedEngagementData}
              onMouseDown={(e) => handleMouseDown(e, 'engagement')}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => format(parseISO(tick), 'MMM')}
                ticks={getUniqueMonthTicks(zoomedEngagementData)}
                type="category"
                allowDataOverflow
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
              <Tooltip content={<CustomEngagementTooltip />} />
              <Bar 
                dataKey="engagement" 
                fill="#82ca9d"
                onClick={handleBarClick}
                shape={(props: any) => {
                  const { x, y, width, height, value } = props;
                  return (
                    <rect 
                      x={x} 
                      y={y} 
                      width={width} 
                      height={height} 
                      fill={value > 0 ? "#82ca9d" : "transparent"} 
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }}
              />
              {refAreaLeft && refAreaRight && activeChart === 'engagement' && (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Engagement Distribution</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={engagementDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={handlePieClick}
              >
                {engagementDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip totalEngagements={totalEngagements} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}