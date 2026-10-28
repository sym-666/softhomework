import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card';
import { Button } from '@/shadcn/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';

import { toast } from 'sonner';
import { FileText, Upload, Download, AlertCircle, Send } from 'lucide-react';
import {
  useCreateCaseByNamelistMutation,
  useGetCaseQuery,
} from '@/redux/api/case';
import {
  useGetSupercomputersQuery,
  useGetCurrentUserQuery,
} from '@/redux/api/user';

const NamelistPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { data: currentUser } = useGetCurrentUserQuery();
  const [namelistContent, setNamelistContent] = useState(`F  0  0  0
iter058f ITER
T_edge = 1.00, n_e_edge/ne-bar = 0.75, <n_e20> = 1.1
100 MW NBI, 90-150 sec, Bt = 5.7T, Ip = 24MA
D + T w/ Carbon + Helium, Zeff = 1.5
&inpt
  btort(1) = 5.68,5.68,5.68,5.68,5.68,5.68,5.68,5.68,5.68
  csawth(1) = 0.9
  csawth(5) = 0
  csawth(9) = 1
  curmat(1) = 21,21,21,21,21,21,21,21,21
  elngbt(1) = 1.6,1.6,1.6,1.6,1.6,1.6,1.6,1.6,1.6
  lsawth(1) = 1
  lsawth(10) = 2
  lsawth(2) = 1
  lsawth(3) = 10
  lsawth(5) = 1
  lsawth(6) = 0
  lsawth(7) = 1
  lsweq(1) = 3
  lsweq(10) = 0
  lsweq(11) = 1
  lsweq(4) = 0
  lsweq(5) = 1
  lsweq(6) = 3
  lsweq(7) = 1
  lsweq(8) = 0
  mflxs = 25
  mom = 3
  mombnd = 2
  neqdt(1) = 10,10,10,10,10,25,25,30,30
  ntbkmx = 9
  qmin = 1.01
  rmajbt(1) = 8.14,8.14,8.14,8.14,8.14,8.14,8.14,8.14,8.14
  rminbt(1) = 2.8,2.8,2.8,2.8,2.8,2.8,2.8,2.8,2.8
  rtort(1) = 8.14,8.14,8.14,8.14,8.14,8.14,8.14,8.14,8.14
  shift = 0.05
  swtoff = 230
  swton = 10.07
  tbk(1) = 10,20,30,40,50,75,100,300,999
  trngbt(1) = 0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24
/
&ncodat
  nwbrem = 0
  nwchex = 0
  nwcool = 1100
  nwioni = 0
  nwline = 1000
  nwreko = 0
  recflx = 0
  recscr = 0
/
&nurun1
  cfutz(1) = 0
  cfutz(10) = 0
  cfutz(11) = 1
  cfutz(110) = 1
  cfutz(111) = 1
  cfutz(112) = 1
  cfutz(113) = 1
  cfutz(12) = 1
  cfutz(19) = 1
  cfutz(2) = 0
  cfutz(200) = 1
  cfutz(201) = 0.04
  cfutz(202) = 0.04
  cfutz(203) = 0.18
  cfutz(204) = 0.18
  cfutz(207) = 1
  cfutz(208) = 1
  cfutz(209) = 0.9
  cfutz(21) = 0
  cfutz(210) = 0.9
  cfutz(22) = 0
  cfutz(23) = 0
  cfutz(24) = 0
  cfutz(281) = 1.2
  cfutz(29) = 0
  cfutz(295) = 1
  cfutz(3) = 0
  cfutz(30) = 2
  cfutz(35) = 0.0002
  cfutz(36) = -6
  cfutz(37) = 0
  cfutz(38) = 0
  cfutz(39) = 3
  cfutz(4) = 0
  cfutz(410) = 1
  cfutz(42) = 0
  cfutz(43) = 500000
  cfutz(44) = 500000
  cfutz(480) = 1
  cfutz(481) = 1
  cfutz(5) = 0
  cfutz(57) = 0
  cfutz(58) = 0
  cfutz(6) = 0
  cfutz(7) = 0
  cfutz(70) = 1
  cfutz(71) = 0.95
  cfutz(74) = 0.12
  cfutz(76) = 0.04
  cfutz(8) = 0
  cfutz(81) = 4
  cfutz(9) = 1
  cimprd(10) = 0.1
  cthery(1) = 0
  cthery(111) = 0
  cthery(112) = 0
  cthery(113) = 0
  cthery(114) = 0
  cthery(12) = -4
  cthery(121) = 1
  cthery(123) = 1
  cthery(124) = 0
  cthery(13) = -4
  cthery(14) = -4
  cthery(15) = -4
  cthery(17) = 0
  cthery(2) = 1.013
  cthery(50) = 10
  cthery(51) = 10
  cthery(52) = 10
  cthery(53) = 10
  cthery(54) = 10
  cthery(6) = 0
  cthery(7) = 1
  cthery(78) = 1
  cthery(79) = 1
  cthery(8) = 3.5
  cthery(81) = -4
  cthery(82) = 0
  cthery(83) = -4
  cthery(85) = 2
  cthery(86) = 0.15
  delmax = 0.25
  errmax = 0.25
  extf = 1
  extzef = 1
  fdr = 0,0,0
  fdrint = 0
  fec = 0,0,0
  fig = 0.8,0.8,0.8
  fkb = 1,0.65,0.65
  fmh = 0,0,0
  frb = 1,1,1
  grecyc = 0
  leqtyp = 11
  limprd(32) = 2
  lnumer(31) = 4
  lsmord = 0
  lthery(13) = 3
  lthery(14) = 1
  lthery(15) = 0
  lthery(16) = 0
  lthery(17) = 1
  lthery(21) = 1
  lthery(25) = 0
  lthery(26) = 400
  lthery(27) = 1
  lthery(29) = 5
  lthery(3) = 4
  lthery(30) = 1
  lthery(31) = 1
  lthery(32) = -2
  lthery(4) = 1
  lthery(5) = 2
  lthery(6) = 1
  lthery(7) = 27
  lthery(8) = 21
  lthery(9) = 2
  ltrnsp(20) = 82
  ltrnsp(21) = 50
  natomc = 2
  nbound = 1
  ngpart = 200
  ngprof = 20
  nlextr = .false.
  nlomt2(13) = .true.
  nlomt2(21) = .true.
  nlomt2(26) = .true.
  nlpomt(1) = .false.
  nlpomt(10) = .false.
  nlpomt(11) = .false.
  nlpomt(12) = .false.
  nlpomt(13) = .false.
  nlpomt(14) = .false.
  nlpomt(15) = .false.
  nlpomt(16) = .false.
  nlpomt(17) = .false.
  nlpomt(18) = .false.
  nlpomt(19) = .false.
  nlpomt(2) = .false.
  nlpomt(20) = .true.
  nlpomt(21) = .true.
  nlpomt(22) = .false.
  nlpomt(23) = .true.
  nlpomt(24) = .true.
  nlpomt(25) = .true.
  nlpomt(3) = .false.
  nlpomt(4) = .false.
  nlpomt(5) = .false.
  nlpomt(6) = .true.
  nlpomt(7) = .true.
  nlpomt(8) = .true.
  nlpomt(9) = .true.
  nplot = 100000
  nrlmod = 1
  nrun = 90
  nsedit = 5
  ntrans = 2
  reread = 70.5
  rleprf = 0.965,0.86,0.764,0.677,0.598,0.526,0.462,0.404,0.352,0.305,0.264,0.228,0.196,0.168,0.144
     ,0.123,0.105,0.0899,0.0769,0.062,0.057,0.0494,0.0432,0.0381,0.0339,0.0305,0.0276
     ,0.0251,0.0209,0.0189,0.017,0.015,0.0129,0.0107,0.0083,0.0057,0.0031,0,0,0,0,0,0,0,0
     ,0,0,0,0,0,0,0,0
  rlepwr = 50000000
  rliprf = 0.965,0.86,0.764,0.677,0.598,0.526,0.462,0.404,0.352,0.305,0.264,0.228,0.196,0.168,0.144
     ,0.123,0.105,0.0899,0.0769,0.062,0.057,0.0494,0.0432,0.0381,0.0339,0.0305,0.0276
     ,0.0251,0.0209,0.0189,0.017,0.015,0.0129,0.0107,0.0083,0.0057,0.0031,0,0,0,0,0,0,0,0
     ,0,0,0,0,0,0,0,0
  rlipwr = 1
  theta = 4
  thetap = 0
  xfutz(2) = 1.732
  xfutz(6) = 0.5
/
&nurun2
  bdhyde(1,1) = 2148100000000,2148100000000,10224000000000,15375000000000,18450000000000,21525000000000
     ,24600000000000,27675000000000,30750000000000,33825000000000,33825000000000
     ,33825000000000,33825000000000,33825000000000,33825000000000
  bdhyde(1,2) = 2148100000000,2148100000000,10224000000000,15375000000000,18450000000000,21525000000000
     ,24600000000000,27675000000000,30750000000000,33825000000000,33825000000000
     ,33825000000000,33825000000000,33825000000000,33825000000000
  bdimpe(1,1) = 77760000000,77760000000,352000000000,500000000000,600000000000,700000000000,800000000000
     ,900000000000,1000000000000,1100000000000,1100000000000,1100000000000,1100000000000
     ,1100000000000,1100000000000
  bdimpe(1,2) = 48600000000,48600000000,720000000000,1875000000000,2250000000000,2625000000000
     ,3000000000000,3375000000000,3750000000000,4125000000000,4125000000000,4125000000000
     ,4125000000000,4125000000000,4125000000000
  bdtee = 3,3,4.206,4.7,5,5,5,5,5,5,5,5,5,5,5
  bdtie = 3,3,4.206,4.7,5,5,5,5,5,5,5,5,5,5,5
  bdtime = 0,90,94,98,102,106,110,114,118,122,126,150,250,500,900
  bz = 56800
  cjbeam = 1
  cpvelc = 0
  cpvion = 0
  curent = 21000
  denga0 = 20354000000000,20354000000000
  denga1 = 2148100000000,2148100000000
  denim0 = 736800000000,460500000000
  denim1 = 77760000000,48600000000
  denmon = 1,27000000000000,27000000000000,40000000000000,50000000000000,60000000000000
     ,70000000000000,80000000000000,90000000000000,100000000000000,110000000000000
     ,110000000000000,110000000000000,110000000000000,110000000000000,110000000000000
  dtinit = 0.0001
  dtmax = 0.5
  eehfit = 2,2
  eeifit = 2,2,2
  ehfit = 1,1
  eifit = 1,1,1
  eioniz = 0.03
  etefit = 1
  etifit = 1
  flgas = 0,0
  flimp(1,:) = 100000000000,100000000000,100000000000,100000000000,100000000000,100000000000,100000000000
     ,100000000000,100000000000,100000000000,100000000000,100000000000,100000000000
     ,100000000000,100000000000,100000000000,100000000000,100000000000,100000000000
     ,100000000000
  ftzeff = 1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5
  gflmax = 7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19
     ,7e19,7e19
  gfract = 0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5
  gftime = 0,90,94,98,102,106,110,114,118,122,126,150,250,500,900
  hangle(3,:) = 28.5,28.5,28.5,28.5,28.5,28.5
  haper(1) = 50,50,50,50,50,50
  haperv(1) = 150,150,150,150,150,150
  hdiv(1) = 0,0,0,0,0,0
  hdivv(1) = 0,0,0,0,0,0
  hebeam(1) = 1000,1000,1000,1000,1000,1000
  height(1) = 150,150,150,150,150,150
  hfocl(1) = 1000,1000,1000,1000,1000,1000
  hfoclv(1) = 1400,1400,1400,1400,1400,1400
  hfract(1,1) = 0.998,0.001,0.001,0.998,0.001,0.001,0.998,0.001,0.001,0.998,0.001,0.001,0.998,0.001,0.001
     ,0.998,0.001,0.001
  hfutz(1) = 0.25
  hlenth(1) = 900,900,900,900,900,900
  hnchek = 0.1
  hpowmw(1) = 16.5,16.5,0,0,0,0
  hrmaj(1) = 800,800,800,800,800,800
  hrmin(1) = 500,500,500,500,500,500
  htchek = 0.3
  htoff(1) = 999,999,999,999,999,999
  hton(1) = 90,90,90,90,90,90
  hwidth(1) = 50,50,50,50,50,50
  nedit = 0
  ngas = -2,-3
  nhaper(1) = 2,2,2,2,2,2
  nhbeam(1) = -2,-2,-2,-2,-2,-2
  nhshap(1) = 2,2,2,2,2,2
  nimp = 6,2
  nipart = 20000
  niprof = 20
  npel2 = 1
  npelga(1) = -2,-2,-2,-2,-2,-2,-2,-2,-2,-2
  npuff = 2
  nrfit = 2
  nskip = 1
  ntty = 1
  ntype = 1
  nzones = 50
  rastar = 1
  rcwals = 814
  rdwals = 420
  rmajor = 814
  rminor = 280
  rpa(1) = 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
  rpela(1) = 0.08,0.08,0.08,0.08,0.08,0.08
  sedit = 5
  splot = 1
  tcold = 1
  tcoldp = 1
  te0 = 3
  te1 = 3
  ti0 = 3
  ti1 = 3
  timp = 0,90,94,98,102,106,110,114,118,122,126,130,140,150,160,170,180,200,500,999
  tinit = 70
  tmax = 120
  tpela(1) = 999,999,999,999,999,999
  vpela(1) = 50000,50000,70000,100000,130000,150000
  ypa(1) = 0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5
/
&nmread
  cimprd(10) = 1
  reread = 90.2
/
&nmread
  cimprd(10) = 1
  dtmax = 0.5
  reread = 245
/
&nmread
  dtmax = 0.2
  reread = 999
/
&nmread
  dtmax = 0.5
/
`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSuperComputer, setSelectedSuperComputer] = useState<
    string | undefined
  >();

  // RTK Query hooks
  const [createCaseByNamelist, { isLoading: isSubmitting }] =
    useCreateCaseByNamelistMutation();

  // 获取URL参数
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const caseId = urlParams.get('caseId');
  const namelistFromUrl = urlParams.get('namelist');

  // 如果有caseId，使用RTK Query获取案例数据
  const { data: caseData } = useGetCaseQuery(caseId ?? '', { skip: !caseId });

  const { data: supercomputers, isLoading: isLoadingSupercomputers } =
    useGetSupercomputersQuery();

  // 超算选项（与逐步输入保持一致：从后端配置拉取）
  const superComputerOptions = (supercomputers ?? []).map((sc) => ({
    name: sc,
    id: sc,
  }));

  // 后端不再提供默认值时，前端默认选中第一个可用超算
  useEffect(() => {
    if (!selectedSuperComputer && supercomputers && supercomputers.length > 0) {
      setSelectedSuperComputer(supercomputers[0]);
    }
  }, [selectedSuperComputer, supercomputers]);

  // 处理URL参数和案例数据
  useEffect(() => {
    if (namelistFromUrl) {
      setNamelistContent(decodeURIComponent(namelistFromUrl));
    }
  }, [namelistFromUrl]);

  useEffect(() => {
    if (caseData?.caseNamelist) {
      setNamelistContent(caseData.caseNamelist);
    }
  }, [caseData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // 检查文件类型
    const allowedExtensions = ['.nml', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValidFile =
      allowedExtensions.some((ext) => fileName.endsWith(ext)) ||
      fileName.includes('jobxdat') ||
      fileName === 'jobxdat';

    if (!isValidFile) {
      toast.error('请选择有效的文件格式 (.nml, .txt, jobxdat)');
      return;
    }

    // 检查文件大小 (限制为10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('文件大小不能超过10MB');
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (content) {
          setNamelistContent(content);
          toast.success(`文件 "${file.name}" 上传成功`);
        } else {
          toast.error('文件内容为空');
        }
      } catch (error) {
        console.error('文件读取错误:', error);
        toast.error('文件读取失败');
      } finally {
        setIsProcessing(false);
        // 清空input值，以便可以重新选择同一个文件
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      toast.error('文件读取失败');
      setIsProcessing(false);
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  const handleDownloadNamelist = () => {
    const blob = new Blob([namelistContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'namelist.nml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Namelist文件已下载');
  };

  const handleSubmit = async () => {
    if (!namelistContent.trim()) {
      toast.error('请先添加 Namelist 内容');
      return;
    }

    if (!selectedSuperComputer) {
      toast.error('请先选择超算');
      return;
    }

    try {
      const result = await createCaseByNamelist({
        Namelist: namelistContent,
        SuperComputer: selectedSuperComputer,
      }).unwrap();

      if (result.success) {
        toast.success('提交成功！');
        if (result.id && currentUser?.id) {
          setLocation(`/cases/${currentUser.id}/${result.id}`);
        } else {
          setLocation('/cases');
        }
      } else {
        toast.error(result.message || '提交失败！');
      }
    } catch (error) {
      console.error('提交错误:', error);
      toast.error('提交失败！');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            从Namelist创建案例
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  您可以上传现有的Namelist文件来创建案例，或者将当前配置导出为Namelist格式。
                </p>
                <p className="text-sm text-muted-foreground">
                  支持的格式：.nml, .txt, jobxdat 文件
                </p>
              </div>
            </div>

            {/* 超算选择和提交按钮 */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">超算选择:</label>
                <Select
                  value={selectedSuperComputer}
                  onValueChange={setSelectedSuperComputer}
                  disabled={isLoadingSupercomputers || !supercomputers?.length}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="选择超算" />
                  </SelectTrigger>
                  <SelectContent>
                    {superComputerOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !namelistContent.trim() ||
                  !selectedSuperComputer
                }
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? '提交中...' : '提交'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium">上传Namelist文件</h3>
                <p className="text-sm text-muted-foreground">
                  选择您的Namelist文件进行导入
                </p>
              </div>

              <input
                type="file"
                accept=".nml,.txt,text/plain,*"
                onChange={handleFileUpload}
                className="hidden"
                id="namelist-file-input"
                ref={(input) => {
                  if (input) {
                    input.click = input.click.bind(input);
                  }
                }}
              />
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                disabled={isProcessing}
                onClick={() => {
                  document.getElementById('namelist-file-input')?.click();
                }}
              >
                {isProcessing ? '处理中...' : '选择文件'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium">下载Namelist</h3>
                <p className="text-sm text-muted-foreground">
                  将当前配置导出为Namelist格式
                </p>
              </div>

              <Button onClick={handleDownloadNamelist} className="w-full">
                下载Namelist
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Editor */}
      {namelistContent && (
        <Card>
          <CardHeader>
            <CardTitle>Namelist 编辑器</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                您可以在下方的编辑器中修改 Namelist 内容
              </p>
              <textarea
                value={namelistContent}
                onChange={(e) => setNamelistContent(e.target.value)}
                className="w-full bg-muted p-4 rounded-md text-sm font-mono border resize-none"
                rows={20}
                placeholder="在这里输入或编辑您的 Namelist 内容..."
                style={{
                  minHeight: '400px',
                  maxHeight: '600px',
                  overflow: 'auto',
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between">
            <Link href="/add-cases">
              <Button variant="outline">返回开始</Button>
            </Link>
            <div className="text-sm text-muted-foreground">
              配置完成后，请点击上方的提交按钮创建案例
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NamelistPage;
