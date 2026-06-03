import svgPaths from "./svg-yvvrobp1t5";

function Link() {
  return (
    <div className="h-[40px] relative rounded-[10px] shrink-0 w-[133.113px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Poppins:Medium',sans-serif] leading-[24px] left-[22px] not-italic text-[#4a5565] text-[16px] top-[8px] whitespace-nowrap">Dashboard</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[3.56%_0.85%_0.12%_0.07%]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 58.4609 21.1898">
        <g id="Group 10">
          <path d={svgPaths.p28a018f0} fill="var(--fill-0, #4A5565)" id="Vector" />
          <path d={svgPaths.p8d2bd00} fill="var(--fill-0, #4A5565)" id="Vector_2" />
          <path d={svgPaths.p18bc3d80} fill="var(--fill-0, #4A5565)" id="Vector_3" />
          <path d={svgPaths.p2a4e8600} fill="var(--fill-0, #4A5565)" id="Vector_4" />
          <path d={svgPaths.p33538d80} fill="var(--fill-0, #4A5565)" id="Vector_5" />
          <path d={svgPaths.p8a17000} fill="var(--fill-0, #4A5565)" id="Vector_6" />
          <path d={svgPaths.p3f459a00} fill="var(--fill-0, #4A5565)" id="Vector_7" />
          <path d={svgPaths.p1bd87480} fill="var(--fill-0, #4A5565)" id="Vector_8" />
          <path d={svgPaths.p15a4b200} fill="var(--fill-0, #4A5565)" id="Vector_9" />
          <path d={svgPaths.p19981a80} fill="var(--fill-0, #4A5565)" id="Vector_10" />
        </g>
      </svg>
    </div>
  );
}

function Logoajiabu1Vectorized() {
  return (
    <div className="absolute h-[22px] left-[29.89px] overflow-clip top-[9px] w-[59px]" data-name="logoajiabu 1 [Vectorized]">
      <Group1 />
    </div>
  );
}

function Link1() {
  return (
    <div className="h-[40px] relative rounded-[10px] shrink-0 w-[120.213px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Logoajiabu1Vectorized />
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[28.56%_8.43%_29.48%_9.08%]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 97 16.7845">
        <g id="Group 9">
          <path d={svgPaths.pf065700} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p74f2000} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p2a934e80} fill="var(--fill-0, white)" id="Vector_3" />
          <path d={svgPaths.p1d3dd200} fill="var(--fill-0, white)" id="Vector_4" />
          <path d={svgPaths.p70a2a00} fill="var(--fill-0, white)" id="Vector_5" />
          <path d={svgPaths.p23eb2ef0} fill="var(--fill-0, white)" id="Vector_6" />
          <path d={svgPaths.p36298cf2} fill="var(--fill-0, white)" id="Vector_7" />
          <path d={svgPaths.p64c2400} fill="var(--fill-0, white)" id="Vector_8" />
        </g>
      </svg>
    </div>
  );
}

function Link2() {
  return (
    <div className="bg-[#101828] h-[40px] relative rounded-[10px] shrink-0 w-[117.588px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Group />
      </div>
    </div>
  );
}

function Navigation() {
  return (
    <div className="absolute content-stretch flex gap-[4px] h-[40px] items-start left-[736px] top-[20px] w-[378.913px]" data-name="Navigation">
      <Link />
      <Link1 />
      <Link2 />
    </div>
  );
}

function Header1() {
  return (
    <div className="absolute h-[24px] left-0 top-[28px] w-[219px]" data-name="Header">
      <p className="absolute font-['Poppins:Bold',sans-serif] leading-[24px] left-0 not-italic text-[#101828] text-[24px] top-[-2.2px] whitespace-nowrap">Inventory System</p>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[80px] relative shrink-0 w-full" data-name="Container">
      <Navigation />
      <Header1 />
    </div>
  );
}

export default function Header() {
  return (
    <div className="bg-[#f1f1f1] content-stretch flex flex-col items-start pb-[0.8px] px-[32px] relative size-full" data-name="Header">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
      <Container />
    </div>
  );
}