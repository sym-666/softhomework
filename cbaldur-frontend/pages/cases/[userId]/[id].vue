<template>
  <UModal v-model="shareModal">
    <div class="p-4">
      分享时间(单位：天，输入-1代表永久有效)：
      <UInput
        class="mb-2"
        type="number"
        max="30"
        v-model="shareTime"
        placeholder="单位：天，输入-1代表永久有效"
      ></UInput>
      <UButton class="mb-2 w-full" @click="submitShare">生成分享链接</UButton>
      <UInput type="text" readonly v-model="shareUrl"></UInput>
    </div>
  </UModal>
  <UModal v-model="tagsModal">
    <div class="p-4">
      输入tags(用逗号分隔)：
      <UInput
        class="mb-2"
        v-model="data.tags"
        placeholder="输入tags(用逗号分隔)"
      ></UInput>
      <UButton class="mb-2 w-full" @click="submitTags">提交</UButton>
    </div>
  </UModal>
  <div class="flex flex-col overflow-scroll">
    <div class="grid grid-cols-12 min-h-[70vh] gap-4 pr-6 mb-4">
      <UCard class="col-span-3">
        <template #header>
          <div class="flex w-full justify-between items-center">
            <div>算例ID：{{ data.id }}</div>
            <div class="flex space-x-2">
              <UButton @click="shareModal = true">分享</UButton>
              <NuxtLink :to="`/cases/advanced/${route.params.userId}/${route.params.id}`">
                <UButton color="purple">高级画图</UButton>
              </NuxtLink>
            </div>
          </div>
        </template>
        <div class="grid grid-cols-3">
          <div class="col-span-1">创建时间：</div>
          <div class="col-span-2">
            {{ convertTime(data.createdAt) }}
          </div>
          <div class="col-span-1">完成时间：</div>
          <div class="col-span-2">
            {{ convertTime(data.updatedAt) }}
          </div>
          <div class="col-span-1 col-end-2">算例备注：</div>
          <div class="col-span-3">
            {{ data.comment }}
          </div>
        </div>
        <template #footer>
          <UButton
            @click="
              () =>
                jsonDownload(
                  JSON.stringify(JSON.parse(data.case.caseJson), null, 2),
                  `${data.case.id}-input.json`
                )
            "
            variant="outline"
            class="w-full h-10 flex items-center justify-center mb-4"
          >
            下载配置文件
          </UButton>
          <UButton class="w-full h-10 flex items-center justify-center mb-4">
            下载算例结果/CSV
          </UButton>
          <UButton
            @click="imgDownload"
            variant="soft"
            class="w-full h-10 flex items-center justify-center"
          >
            下载图片
          </UButton>
          <div class="mt-4">
            <UBadge
              class="mr-2"
              v-if="data.tags"
              v-for="tag in data.tags.split(',')"
              variant="subtle"
              >{{ tag }}</UBadge
            >
            <UBadge
              class="hover:cursor-pointer"
              @click="tagsModal = true"
              variant="outline"
              >修改tags</UBadge
            >
          </div>
        </template>
      </UCard>
      <UCard class="col-span-2 overflow-hidden">
        <div class="flex flex-col justify-between">
          <div class="mb-4">
            <div>绘图文件：</div>
            <URadioGroup
              :model-value="nowType"
              @change="groupChange"
              :options="typeOptions"
              class="flex flex-col gap-4"
            />
          </div>

          <div v-show="nowType !== 'gfile'" class="mb-4">
            <div>绘图模式</div>
            <URadioGroup
              :model-value="nowMode"
              @change="
                (value) => {
                  nowMode = value;
                }
              "
              :options="modeOptions"
              class="flex flex-col gap-4"
            />
          </div>
          <div v-if="nowMode === 'single'" class="mb-4">
            <div>绘图时间</div>
            <USelectMenu
              v-model="nowTime"
              @change="
                () => {
                  updatePlot();
                }
              "
              :options="timeOptions"
            >
            </USelectMenu>
          </div>
          <div v-if="nowMode === 'time'" class="mb-4">
            <div>绘图时间</div>
            <USelectMenu
              multiple
              v-model="nowTimes"
              @change="
                () => {
                  updatePlot();
                }
              "
              :options="timeOptions"
            >
            </USelectMenu>
          </div>
          <div v-if="nowMode === 'case'" class="mb-4">
            <div v-for="nowCase in nowCases">
              <div @click="() => {}">算例</div>
              <USelectMenu
                :model-value="nowCase.caseId"
                @change="
                  (value) => {
                    nowCase.caseId = Number(value);
                    updatePlot();
                  }
                "
                :options="caseIDs as String[]"
              ></USelectMenu>
              <div>该算例绘图时间</div>
              <USelectMenu
                multiple
                v-model="nowCase.times"
                @change="
                  () => {
                    updatePlot();
                  }
                "
                :options="caseOptions[`${nowCase.caseId}`]"
              >
              </USelectMenu>
            </div>

            <div class="grid grid-cols-2">
              <UButton
                class="mt-2"
                variant="outline"
                block
                @click="
                  () => {
                    nowCases.push({
                      caseId: Number(route.params['id']),
                      times: [],
                    });
                  }
                "
                >添加</UButton
              >
              <UButton
                class="mt-2"
                variant="soft"
                block
                @click="
                  () => {
                    nowCases = [
                      {
                        caseId: Number(route.params['id']),
                        times: [timeOptions[0]],
                      },
                    ];
                  }
                "
                >清空</UButton
              >
            </div>
          </div>
        </div>
      </UCard>
      <UCard class="col-span-7">
        <div id="container" class="w-full h-full relative"></div>
      </UCard>
    </div>
    <div v-show="nowType !== 'gfile'" class="grid grid-cols-12 gap-4 pr-6">
      <UCard class="col-span-1">
        <p>x变量</p>
        <p class="mb-2">
          <USelectMenu
            @change="updatePlot"
            v-model="xOperate"
            :options="operateOptions"
            value-attribute="value"
            option-attribute="label"
          ></USelectMenu>
        </p>
        <p>
          <UInput
            @change="updatePlot"
            v-if="xOperate !== Operate.none"
            v-model="xOperateValue"
          ></UInput>
        </p>
      </UCard>
      <UCard class="col-span-11" :ui="{ body: { base: 'w-full' } }">
        <div class="grid grid-cols-12 w-full gap-2">
          <div class="col-span-1" v-for="header in nowHeaders">
            <UButton
              class="w-full"
              v-if="header !== nowX"
              @click="
                () => {
                  nowX = header;
                  updatePlot();
                }
              "
              variant="soft"
              >{{ header }}</UButton
            >
            <UButton class="w-full" v-else variant="solid">{{
              header
            }}</UButton>
          </div>
        </div>
      </UCard>
      <UCard class="col-span-1">
        <p>y变量</p>
        <p class="mb-2">
          <USelectMenu
            @change="updatePlot"
            v-model="yOperate"
            :options="operateOptions"
            value-attribute="value"
            option-attribute="label"
          ></USelectMenu>
        </p>
        <p>
          <UInput
            @change="updatePlot"
            v-if="yOperate !== Operate.none"
            v-model="yOperateValue"
          ></UInput>
        </p>
      </UCard>
      <UCard class="col-span-11" :ui="{ body: { base: 'w-full' } }">
        <div class="grid grid-cols-12 w-full gap-2">
          <div class="col-span-1" v-for="header in nowHeaders">
            <UButton
              class="w-full"
              v-if="header !== nowY"
              @click="
                () => {
                  nowY = header;
                  updatePlot();
                }
              "
              variant="soft"
              >{{ header }}</UButton
            >
            <UButton class="w-full" v-else variant="solid">{{
              header
            }}</UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Chart } from "@antv/g2";
import * as d3 from "d3";

enum Operate {
  none,
  plus,
  minus,
  multiply,
  divide,
}
const renameKeys=(points:{x:number,y:number,[key:string]:any}[],xKey:string,yKey:string):{[key:string]:any}[]=>{
  return points.map(point => {
    const { x, y, ...newPoint } = point;
    newPoint[xKey] = point.x;
    newPoint[yKey] = point.y;
    return newPoint;
  });
}
const route = useRoute();
const convertTime = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getFullYear()}年${
    date.getMonth() + 1
  }月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};
const tagsModal = ref(false);

const shareModal = ref(false);
const shareTime = ref(7);
const shareUrl = ref("");
const cases: any = await useMyFetch("/api/Case/GetCases", {
  method: "GET",
});
const caseIDs = ref([route.params["id"]]);
const nowType = ref("eq1D");
const typeOptions = [
  {
    label: "一维平衡剖面",
    value: "eq1D",
  },
  {
    label: "二维平衡剖面",
    value: "eq2D",
  },
  // {
  //   label: "功率分布",
  //   value: "en",
  // },
  {
    label: "平衡分布",
    value: "prof",
  },
  {
    label: "Gfile平衡分布",
    value: "gfile",
  },
  {
    label: "XF",
    value: "XF"
  },
  {
    label: "YF",
    value: "YF"
  }
];

const nowMode = ref("single");
const modeOptions = [
  {
    label: "本算例单个绘图",
    value: "single",
  },
  {
    label: "本算例不同时间比较",
    value: "time",
  },
  {
    label: "与不同算例进行对比",
    value: "case",
  },
];
const operateOptions = [
  { label: "", value: Operate.none },
  { label: "+", value: Operate.plus },
  { label: "-", value: Operate.minus },
  { label: "*", value: Operate.multiply },
  { label: "/", value: Operate.divide },
];
const xOperate = ref(Operate.none);
const yOperate = ref(Operate.none);
const xOperateValue = ref(0);
const yOperateValue = ref(0);
const timeOptions = ref(
  (
    (await $$fetch("/api/Plot/GetTimes", {
      method: "GET",
      query: {
        userId: Number(route.params["userId"]),
        caseId: Number(route.params["id"]),
        type: nowType.value,
      },
    })) as any[]
  ).sort(
    (a, b) =>
      Number(a.split("_")[0] + "." + a.split("_")[1]) -
      Number(b.split("_")[0] + "." + b.split("_")[1])
  )
);
const nowTime = ref(timeOptions.value[0]);
const nowTimes = ref([timeOptions.value[0]]);

const nowCases = ref([
  {
    caseId: Number(route.params["id"]),
    times: [timeOptions.value[0]],
  },
]);
const caseOptions = ref<any>({});
caseOptions.value[String(route.params["id"])] = [timeOptions.value[0]];
const nowHeaders: any = ref(
  await $$fetch("/api/Plot/GetHeaders", {
    method: "GET",
    query: {
      userId: Number(route.params["userId"]),
      caseId: Number(route.params["id"]),
      type: nowType.value,
    },
  })
);
const nowX = ref(nowHeaders.value[0]);
const nowY = ref(nowHeaders.value[0]);
const { data }: { data: any } = await useMyFetch("/api/case/GetCase", {
  query: { id: Number(route.params["id"]) },
});
var jsonDownload = (content: string, filename: string) => {
  // 创建隐藏的可下载链接
  var eleLink = document.createElement("a");
  eleLink.download = filename;
  eleLink.style.display = "none";
  // 字符内容转变成blob地址
  var blob = new Blob([content]);
  eleLink.href = URL.createObjectURL(blob);
  // 触发点击
  document.body.appendChild(eleLink);
  eleLink.click();
  // 然后移除
  document.body.removeChild(eleLink);
};
const plotData = ref({});
let chart: Chart;
const updatePlot = () => {
  if (nowMode.value === "single") {
    $$fetch("/api/Plot/GetPlot", {
      method: "GET",
      query: {
        userId: Number(route.params["userId"]),
        caseId: Number(route.params["id"]),
        type: nowType.value,
        time: nowTime.value,
        x: nowX.value,
        y: nowY.value,
      },
    }).then((plots: any) => {
      let data = plots;
      if (xOperateValue) {
        switch (xOperate.value) {
          case Operate.plus:
            data = plots.map((item: any) => {
              return { ...item, x: item.x + Number(xOperateValue.value) };
            });
            break;
          case Operate.minus:
            data = plots.map((item: any) => {
              return { ...item, x: item.x - xOperateValue.value };
            });
            break;
          case Operate.multiply:
            data = plots.map((item: any) => {
              return { ...item, x: item.x * xOperateValue.value };
            });
            break;
          case Operate.divide:
            if (xOperateValue.value === 0) {
              data = plots;
            } else {
              data = plots.map((item: any) => {
                return { ...item, x: item.x / xOperateValue.value };
              });
            }

            break;
          default:
            data = plots;
        }
      }
      if (yOperateValue) {
        switch (yOperate.value) {
          case Operate.plus:
            data = data.map((item: any) => {
              return { ...item, y: item.y + Number(yOperateValue.value) };
            });
            break;
          case Operate.minus:
            data = data.map((item: any) => {
              return { ...item, y: item.y - yOperateValue.value };
            });
            break;
          case Operate.multiply:
            data = data.map((item: any) => {
              return { ...item, y: item.y * yOperateValue.value };
            });
            break;
          case Operate.divide:
            if (yOperateValue.value === 0) {
              data = data;
            } else {
              data = data.map((item: any) => {
                return { ...item, y: item.y / yOperateValue.value };
              });
            }

            break;
          default:
            data = data;
        }
      }
      chart.clear();
      data = renameKeys(data, nowX.value, nowY.value);
      chart.data(data).encode("x", nowX.value).encode("y", nowY.value);
      chart.line().encode("shape", "smooth").interaction("brushFilter",true);
      chart.render();
    });
  } else if (nowMode.value === "time") {
    $$fetch("/api/Plot/GetPlotAcrossTimes", {
      method: "POST",
      body: {
        userId: Number(route.params["userId"]),
        caseId: Number(route.params["id"]),
        type: nowType.value,
        times: nowTimes.value,
        x: nowX.value,
        y: nowY.value,
      },
    }).then((plotsAcrossTimes: any) => {
      let data = plotsAcrossTimes;
      if (xOperateValue) {
        switch (xOperate.value) {
          case Operate.plus:
            data = plotsAcrossTimes.map((item: any) => {
              return { ...item, x: item.x + Number(xOperateValue.value) };
            });
            break;
          case Operate.minus:
            data = plotsAcrossTimes.map((item: any) => {
              return { ...item, x: item.x - xOperateValue.value };
            });
            break;
          case Operate.multiply:
            data = plotsAcrossTimes.map((item: any) => {
              return { ...item, x: item.x * xOperateValue.value };
            });
            break;
          case Operate.divide:
            if (xOperateValue.value === 0) {
              data = plotsAcrossTimes;
            } else {
              data = plotsAcrossTimes.map((item: any) => {
                return { ...item, x: item.x / xOperateValue.value };
              });
            }

            break;
          default:
            data = plotsAcrossTimes;
        }
      }
      if (yOperateValue) {
        switch (yOperate.value) {
          case Operate.plus:
            data = data.map((item: any) => {
              return { ...item, y: item.y + Number(yOperateValue.value) };
            });
            break;
          case Operate.minus:
            data = data.map((item: any) => {
              return { ...item, y: item.y - yOperateValue.value };
            });
            break;
          case Operate.multiply:
            data = data.map((item: any) => {
              return { ...item, y: item.y * yOperateValue.value };
            });
            break;
          case Operate.divide:
            if (yOperateValue.value === 0) {
              data = data;
            } else {
              data = data.map((item: any) => {
                return { ...item, y: item.y / yOperateValue.value };
              });
            }

            break;
          default:
            data = data;
        }
      }
      chart.clear();
      data = renameKeys(data, nowX.value, nowY.value);
      chart
        .data(data)
        .encode("x", nowX.value)
        .encode("y", nowY.value)
        .encode("color", "time");
      chart.axisX({
        label: nowX,
      });
      chart.axisY({
        label: nowY,
      });
      chart.line().encode("shape", "smooth").interaction("brushFilter",true);
      chart.render();
    });
  } else if (nowMode.value === "case") {
    $$fetch("/api/Plot/GetPlotAcrossCases", {
      method: "POST",
      body: {
        userId: Number(route.params["userId"]),
        type: nowType.value,
        cases: nowCases.value,
        x: nowX.value,
        y: nowY.value,
      },
    }).then((plotsAcrossCases: any) => {
      let data = plotsAcrossCases;
      if (xOperateValue) {
        switch (xOperate.value) {
          case Operate.plus:
            data = plotsAcrossCases.map((item: any) => {
              return { ...item, x: item.x + Number(xOperateValue.value) };
            });
            break;
          case Operate.minus:
            data = plotsAcrossCases.map((item: any) => {
              return { ...item, x: item.x - xOperateValue.value };
            });
            break;
          case Operate.multiply:
            data = plotsAcrossCases.map((item: any) => {
              return { ...item, x: item.x * xOperateValue.value };
            });
            break;
          case Operate.divide:
            if (xOperateValue.value === 0) {
              data = plotsAcrossCases;
            } else {
              data = plotsAcrossCases.map((item: any) => {
                return { ...item, x: item.x / xOperateValue.value };
              });
            }

            break;
          default:
            data = plotsAcrossCases;
        }
      }
      if (yOperateValue) {
        switch (yOperate.value) {
          case Operate.plus:
            data = data.map((item: any) => {
              return { ...item, y: item.y + Number(yOperateValue.value) };
            });
            break;
          case Operate.minus:
            data = data.map((item: any) => {
              return { ...item, y: item.y - yOperateValue.value };
            });
            break;
          case Operate.multiply:
            data = data.map((item: any) => {
              return { ...item, y: item.y * yOperateValue.value };
            });
            break;
          case Operate.divide:
            if (yOperateValue.value === 0) {
              data = data;
            } else {
              data = plotsAcrossCases.map((item: any) => {
                return { ...item, y: item.y / yOperateValue.value };
              });
            }
            break;
          default:
            data = data;
        }
      }
      chart.clear();
      data = renameKeys(data, nowX.value, nowY.value);
      chart
        .data(data)
        .encode("x", nowX.value)
        .encode("y", nowY.value)
        .encode("color", "time");
      chart.axisX({
        label: nowX,
      });
      chart.axisY({
        label: nowY,
      });
      chart.line().encode("shape", "smooth").interaction("brushFilter",true);
      chart.render();
    });
  }
};
const imgDownload = () => {
  const canvas = document.querySelector(
    "#container canvas"
  ) as HTMLCanvasElement;
  const link = document.createElement("a");
  link.download = `case${route.params["id"]}-${nowX.value}-${nowY.value}.png`;
  link.href = canvas.toDataURL();
  link.click();
};

const gfileData = reactive({
  psirz: [],
  rdim: 0,
  zdim: 0,
  caseValues: [],
  idum: 0,
  nw: 0,
  nh: 0,
  rcentr: 0,
  rleft: 0,
  zmid: 0,
  rmaxis: 0,
  zmaxis: 0,
  simag: 0,
  sibry: 0,
  bcentr: 0,
  current: 0,
  xdum: 0,
  fpol: [],
  pres: [],
  ffprim: [],
  pprime: [],
  qpsi: [],
  nbbbs: 0,
  limitr: 0,
  rbbbs: [],
  zbbbs: [],
  rlim: [],
  zlim: [],
  rmax: 0,
  zmax: 0,
  zmin: 0,
});

const handleGfileData = async () => {
  try {
    const response = await $$fetch("/api/Case/GetGfile", {
      method: "GET",
      query: {
        userId: Number(route.params["userId"]),
        caseId: Number(route.params["id"]),
        type: nowType.value,
        time: nowTime.value
      },
    });

    const {
      psirz,
      rdim,
      zdim,
      idum,
      nw,
      nh,
      rcentr,
      rleft,
      zmid,
      rmaxis,
      zmaxis,
      simag,
      sibry,
      bcentr,
      current,
      xdum,
      fpol,
      pres,
      ffprim,
      pprime,
      qpsi,
      nbbbs,
      limitr,
      rbbbs,
      zbbbs,
      rlim,
      zlim,
      case: caseValues,
    } = response;

    const transpose = (matrix: number[][]): number[][] => {
      return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
    };
    // 将数据存储到gfileData
    gfileData.psirz = transpose(psirz);
    gfileData.rdim = rdim;
    gfileData.zdim = zdim;
    gfileData.caseValues = caseValues;
    gfileData.idum = idum;
    gfileData.nw = nw;
    gfileData.nh = nh;
    gfileData.rcentr = rcentr;
    gfileData.rleft = rleft;
    gfileData.zmid = zmid;
    gfileData.rmaxis = rmaxis;
    gfileData.zmaxis = zmaxis;
    gfileData.simag = simag;
    gfileData.sibry = sibry;
    gfileData.bcentr = bcentr;
    gfileData.current = current;
    gfileData.xdum = xdum;
    gfileData.fpol = fpol;
    gfileData.pres = pres;
    gfileData.ffprim = ffprim;
    gfileData.pprime = pprime;
    gfileData.qpsi = qpsi;
    gfileData.nbbbs = nbbbs;
    gfileData.limitr = limitr;
    gfileData.rbbbs = rbbbs;
    gfileData.zbbbs = zbbbs;
    gfileData.rlim = rlim;
    gfileData.zlim = zlim;
    gfileData.rmax = rleft + rdim;
    gfileData.zmax = zmid + zdim / 2;
    gfileData.zmin = zmid - zdim / 2;

    console.log("Gfile 数据已存储:", gfileData);
  } catch (error) {
    console.error("获取 Gfile 数据失败:", error);
  }
};

const drawContourChart = (container: HTMLElement) => {
  const level = 50;

  const contourWidth = 320; // 等高线图宽度
  const lineChartWidth = 320; // 每幅线图宽度
  const totalWidth = contourWidth + lineChartWidth + 100;

  const height =
    (contourWidth * (gfileData.zmax - gfileData.zmin)) /
    (gfileData.rmax - gfileData.rleft);
  const margin = { top: 20, right: 10, bottom: 80, left: 65 };
  const lineChartHeight = (height - margin.top - margin.bottom - 80) / 2; // 线图高度

  // Contour Plot
  // const rPoints = d3.range(
  //   gfileData.rleft,
  //   gfileData.rmax,
  //   gfileData.rdim / (gfileData.nw - 1)
  // );
  // const zPoints = d3.range(
  //   // 由于zmin=-zmax. 而rleft!=rmax, 因此z和r的分段方式不同
  //   gfileData.zmin,
  //   gfileData.zmax,
  //   gfileData.zdim / gfileData.nh
  // );
  const rPoints = Array.from(
    { length: gfileData.nw },
    (_, i) =>
      gfileData.rleft +
      i * ((gfileData.rmax - gfileData.rleft) / (gfileData.nw - 1))
  );

  const zPoints = Array.from(
    { length: gfileData.nh },
    (_, i) =>
      gfileData.zmin +
      i * ((gfileData.zmax - gfileData.zmin) / (gfileData.nh - 1))
  );

  console.log("rpoints:", rPoints);
  console.log("zpoints:", zPoints);
  // 调整比例
  // const dataAspectRatio =
  //   (gfileData.rmax - gfileData.rleft) / (gfileData.zmax - gfileData.zmin);
  // const adjustedHeight =
  //   (contourWidth - margin.left - margin.right) / dataAspectRatio;

  const xScale = d3
    .scaleLinear()
    .domain([gfileData.rleft, gfileData.rmax])
    .range([margin.left, contourWidth - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain([gfileData.zmin, gfileData.zmax])

    .range([
      height - margin.bottom,
      height -
        margin.bottom -
        ((contourWidth - margin.right - margin.left) *
          (gfileData.zmax - gfileData.zmin)) /
          (gfileData.rmax - gfileData.rleft),
    ]);

  const minValue = d3.min(gfileData.psirz.flat())!;
  const maxValue = d3.max(gfileData.psirz.flat())!;
  const contourThresholds = d3.range(
    minValue,
    maxValue,
    (maxValue - minValue) / level
  );

  const contourData = d3
    .contours()
    .size([gfileData.nw, gfileData.nh])
    .thresholds(contourThresholds)(gfileData.psirz.flat());

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", totalWidth)
    .attr("height", height);

  svg
    .selectAll("path")
    .data(contourData)
    .enter()
    .append("path")
    .attr(
      "d",
      d3.geoPath(
        d3.geoTransform({
          point: function (x, y) {
            const rInterp = d3.interpolate(
              rPoints[0],
              rPoints[gfileData.nw - 1]
            );
            const zInterp = d3.interpolate(
              zPoints[0],
              zPoints[gfileData.nh - 1]
            );

            const r = rInterp(x / gfileData.nw);
            const z = zInterp(y / gfileData.nh);

            this.stream.point(xScale(r), yScale(z));
          },
        })
      )
    )
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round");
  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".1f"));
  const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".1f"));
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

  svg
    .append("text")
    .attr("x", contourWidth / 2)
    .attr("y", height - margin.bottom / 2 + 20)
    .style("text-anchor", "middle")
    .text("R (m)");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", margin.left / 2 - 20)
    .style("text-anchor", "middle")
    .text("Z (m)");

  const rzlimpoints = gfileData.rlim.map((x, index) => ({
    x,
    y: gfileData.zlim[index],
  }));
  const rzbbbs = gfileData.rbbbs.map((x, index) => ({
    x,
    y: gfileData.zbbbs[index],
  }));
  rzbbbs.push(rzbbbs[0]); // 首尾闭合

  console.log(rzbbbs);
  const lineGenerator = d3
    .line()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y));

  svg
    .append("path")
    .data([rzlimpoints])
    .attr("class", "line")
    .attr("d", lineGenerator)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2);

  svg
    .selectAll(".marker")
    .data(rzlimpoints)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.x))
    .attr("cy", (d) => yScale(d.y))
    .attr("r", 5)
    .attr("fill", "red");

  svg
    .append("path")
    .data([rzbbbs])
    .attr("class", "line")
    .attr("d", lineGenerator)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 2);

  // Contour Plot
  // Line Plit

  const lineData1 = gfileData.pres;
  const lineData2 = gfileData.qpsi;
  // 右侧线图 X 和 Y 轴范围
  const xScaleLine = d3.scaleLinear().domain([0, 1]).range([0, lineChartWidth]);

  // 第一幅图的 yScale
  const yScaleLine1 = d3
    .scaleLinear()
    .domain([d3.min(lineData1)!, d3.max(lineData1)!])
    .range([lineChartHeight, 0]);

  // 第二幅图的 yScale
  const yScaleLine2 = d3
    .scaleLinear()
    .domain([d3.min(lineData2)!, d3.max(lineData2)!])
    .range([lineChartHeight, 0]);

  const lineGenerator1 = d3
    .line<number>()
    .x((_, i) => xScaleLine(i / (lineData1.length - 1)))
    .y((d) => yScaleLine1(d));
  const lineGenerator2 = d3
    .line<number>()
    .x((_, i) => xScaleLine(i / (lineData2.length - 1)))
    .y((d) => yScaleLine2(d));
  const xAxisLine = d3
    .axisBottom(xScaleLine)
    .ticks(5)
    .tickFormat(d3.format(".1f"));

  // 绘制第一幅线图
  const lineChart1 = svg
    .append("g")
    .attr(
      "transform",
      `translate(${lineChartWidth + margin.right + 80},${margin.top})`
    );

  lineChart1
    .append("path")
    .datum(lineData1)
    .attr("d", lineGenerator1)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  lineChart1
    .append("g")
    .call(d3.axisLeft(yScaleLine1).ticks(5))
    .attr("transform", `translate(0,0)`);

  lineChart1
    .append("g")
    .call(xAxisLine)
    .attr("transform", `translate(0,${lineChartHeight})`);
  // 横坐标标签

  lineChart1
    .append("text")
    .attr("x", (lineChartWidth - margin.left - margin.right) / 2)
    .attr("y", lineChartHeight - margin.bottom / 2 + 80) // 下方
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .text("PSI normal");

  // 纵坐标标签
  lineChart1
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(lineChartHeight - margin.top - margin.bottom) / 2) // 垂直居中
    .attr("y", -margin.left / 2 - 30) // 左侧
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Pressure(Pa)");

  // 绘制第二幅线图
  const lineChart2 = svg
    .append("g")
    .attr(
      "transform",
      `translate(${lineChartWidth + margin.right + 80},${height / 2})`
    );

  lineChart2
    .append("path")
    .datum(lineData2)
    .attr("d", lineGenerator2)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  lineChart2
    .append("g")
    .call(d3.axisLeft(yScaleLine2).ticks(5))
    .attr("transform", `translate(0,0)`);

  lineChart2
    .append("g")
    .call(xAxisLine)
    .attr("transform", `translate(0,${lineChartHeight})`);
  // 横坐标标签

  lineChart2
    .append("text")
    .attr("x", (lineChartWidth - margin.left - margin.right) / 2)
    .attr("y", lineChartHeight - margin.bottom / 2 + 80) // 下方
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .text("PSI normal");

  // 纵坐标标签
  lineChart2
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(lineChartHeight - margin.top - margin.bottom) / 2)
    .attr("y", -margin.left / 2 - 30)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Safety Factor");

  console.log(gfileData.pres);
  console.log(gfileData.qpsi);
};

const groupChange = async (value: any) => {
  nowType.value = value;
  const container = document.querySelector("#container");

  if (!container) {
    console.error("绘图容器未找到，请检查");
    return;
  }

  // 如果 nowType.value === "gfile" 则创建子绘图容器并绘图
  if (nowType.value === "gfile") {
    await handleGfileData();
    let overlayContainer = document.querySelector("#overlay-container");

    if (!overlayContainer) {
      // 动态创建一个覆盖层容器
      overlayContainer = document.createElement("div");
      overlayContainer.id = "overlay-container";
      overlayContainer.style.position = "absolute";
      overlayContainer.style.top = "0";
      overlayContainer.style.left = "0";
      overlayContainer.style.width = "100%";
      overlayContainer.style.height = "100%";
      overlayContainer.style.backgroundColor = "rgba(255, 255, 255, 1";
      container.appendChild(overlayContainer); // 添加到主容器中
    }

    // 清空覆盖容器并绘制
    overlayContainer.innerHTML = "";
    drawContourChart(overlayContainer);
    return;
  }

  // 如果 nowType.value !=== "gfile" 移除覆盖层容器
  const overlayContainer = document.querySelector("#overlay-container");
  if (overlayContainer) {
    container.removeChild(overlayContainer);
  }

  nowHeaders.value = await $$fetch("/api/Plot/GetHeaders", {
    method: "GET",
    query: {
      caseId: Number(route.params["id"]),
      type: nowType.value,
    },
  });
  nowX.value = nowHeaders.value[0];
  nowY.value = nowHeaders.value[0];

  timeOptions.value = (
    (await $$fetch("/api/Plot/GetTimes", {
      method: "GET",
      query: {
        caseId: Number(route.params["id"]),
        type: nowType.value,
      },
    })) as any
  ).sort(
    (a: string, b: string) =>
      Number(a) -
      Number(b)
  );

  nowTime.value = timeOptions.value[0];
  nowTimes.value = [timeOptions.value[0]];
  nowCases.value = [
    {
      caseId: Number(route.params["id"]),
      times: [timeOptions.value[0]],
    },
  ];

  updatePlot();
};
const submitShare = () => {
  $$fetch("/api/Case/ShareCase", {
    method: "PUT",
    body: {
      CaseId: route.params["id"],
      Period: shareTime.value,
    },
  }).then((data: any) => {
    shareUrl.value =
      window.location.protocol+"//" + window.location.host + `/share/${data.data}`;
  });
};
const submitTags = () => {
  $$fetch("/api/Case/UpdateCase", {
    method: "POST",
    body: {
      ...data.value,
    },
  }).then(() => (tagsModal.value = false));
};
onMounted(() => {
  chart = new Chart({
    container: "container",
    theme: 'academy',
    autoFit: true,
  });
  caseIDs.value = cases.data.value.map((a: any) => String(a.id));
  for (const item of caseIDs.value) {
    $$fetch("/api/Plot/GetTimes", {
      method: "GET",
      query: {
        caseId: Number(item),
        type: nowType.value,
      },
    }).then((res: any) => {
      caseOptions.value[String(item)] = res.sort(
        (a: string, b: string) =>
          Number(a.split("_")[0] + "." + a.split("_")[1]) -
          Number(b.split("_")[0] + "." + b.split("_")[1])
      );
    });
  }
  updatePlot();
});
</script>

<style></style>
