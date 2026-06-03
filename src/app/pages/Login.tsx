import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import svgPaths from "../../imports/Login/svg-z90rfivieb";
import imgParasoestransp2 from "../../imports/Login/f6093fbbd983e79f9517960d323493d93d16f367.png";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function Logoajiabu1Vectorized() {
  return (
    <div
      className="col-1 h-[57px] ml-0 mt-0 relative row-1 w-[154px]"
      data-name="logoajiabu 1 [Vectorized]"
    >
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 154 57"
      >
        <g id="logoajiabu 1 [Vectorized]">
          <path
            d={svgPaths.p2b12ba80}
            fill="var(--fill-0, #E53935)"
            id="Vector"
          />
          <path
            d={svgPaths.p36195f80}
            fill="var(--fill-0, #E53935)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p1b367600}
            fill="var(--fill-0, #E53935)"
            id="Vector_3"
          />
          <path
            d={svgPaths.p28325800}
            fill="var(--fill-0, #E53935)"
            id="Vector_4"
          />
          <path
            d={svgPaths.p30f56180}
            fill="var(--fill-0, #E53935)"
            id="Vector_5"
          />
          <path
            d={svgPaths.p1fd3c200}
            fill="var(--fill-0, #E53935)"
            id="Vector_6"
          />
          <path
            d={svgPaths.p1001b3c0}
            fill="var(--fill-0, #E53935)"
            id="Vector_7"
          />
          <path
            d={svgPaths.p395e8d80}
            fill="var(--fill-0, #E53935)"
            id="Vector_8"
          />
          <path
            d={svgPaths.p2c05b400}
            fill="var(--fill-0, #E53935)"
            id="Vector_9"
          />
          <path
            d={svgPaths.p20ea5a00}
            fill="var(--fill-0, #E53935)"
            id="Vector_10"
          />
        </g>
      </svg>
    </div>
  );
}

function Container2() {
  return (
    <div
      className="bg-[#bae4f9] col-1 h-[47px] ml-[228.9px] mt-[5px] relative rounded-[10px] row-1 w-[155px]"
      data-name="Container"
    >
      <div
        className="absolute h-[29px] left-[11.9px] top-[9px] w-[131px]"
        data-name="parasoestransp 2"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            alt=""
            className="absolute h-[458.6%] left-0 max-w-none top-[-173.89%] w-full"
            src={imgParasoestransp2}
          />
        </div>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="col-1 ml-[180.9px] mt-[18px] relative row-1 size-[22px]">
      <div className="absolute inset-[-3.21%_-3.21%_0_-3.21%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 23.4142 22.7071"
        >
          <g id="Group 12">
            <line
              id="Line 1"
              stroke="var(--stroke-0, black)"
              x1="1.06066"
              x2="23.0607"
              y1="0.353553"
              y2="22.3536"
            />
            <line
              id="Line 2"
              stroke="var(--stroke-0, black)"
              transform="matrix(-0.707107 0.707107 0.707107 0.707107 22.7071 0.707107)"
              x2="31.1127"
              y1="-0.5"
              y2="-0.5"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Logoajiabu1Vectorized />
      <Container2 />
      <Group1 />
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Heading 1">
      <p
        className="-translate-x-1/2 absolute font-['DM_Sans:ExtraBold',sans-serif] font-extrabold leading-[36px] left-1/2 text-[#101828] text-[30px] text-center top-[-1.6px] whitespace-nowrap"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Inventory System
      </p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-1/2 not-italic text-[#4a5565] text-[16px] text-center top-[-2.2px] whitespace-nowrap">{`Paradose & Parasoes `}</p>
    </div>
  );
}

function Container3() {
  return (
    <div
      className="content-stretch flex flex-col gap-[8px] h-[68px] items-start relative shrink-0 w-full"
      data-name="Container"
    >
      <Heading />
      <Paragraph />
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Mohon isi email dan password!");
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);

    if (result.success) {
      toast.success("Login berhasil! Selamat datang.");
      navigate("/");
    } else {
      toast.error(result.error || "Email atau password salah!");
      setPassword("");
    }
    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage:
          "linear-gradient(147.424deg, rgb(255, 251, 235) 0%, rgb(255, 247, 237) 50%, rgb(255, 237, 212) 100%)",
      }}
    >
      <div className="h-[720.8px] w-[448px]">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24px] items-start relative size-full">
          <div className="bg-white h-[676.8px] relative rounded-[16px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] shrink-0 w-full">
            <form
              onSubmit={handleSubmit}
              className="content-stretch flex flex-col gap-[32px] items-start pt-[32px] px-[32px] relative size-full"
            >
              <Group />
              <Container3 />

              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
                {/* Email Field */}
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <div className="h-[20px] relative shrink-0 w-full">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#364153] text-[14px] top-[-0.2px] whitespace-nowrap">
                      Email
                    </p>
                  </div>
                  <div className="h-[49.6px] relative shrink-0 w-full">
                    <div className="absolute h-[49.6px] left-0 rounded-[10px] top-0 w-full">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Masukkan email"
                        className="content-stretch flex items-center overflow-clip pl-[40px] pr-[12px] py-[12px] relative rounded-[inherit] size-full font-['Inter:Regular',sans-serif] font-normal text-[16px] border-[#d1d5dc] border-[0.8px] border-solid focus:outline-none focus:ring-2 focus:ring-[#e17100]"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="absolute content-stretch flex h-[49.6px] items-center left-0 pl-[12px] top-0 w-[32px] pointer-events-none">
                      <div className="relative shrink-0 size-[20px]">
                        <svg
                          className="absolute block inset-0 size-full"
                          fill="none"
                          preserveAspectRatio="none"
                          viewBox="0 0 20 20"
                        >
                          <g id="Icon">
                            <path
                              d={svgPaths.p2026e800}
                              id="Vector"
                              stroke="var(--stroke-0, #99A1AF)"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.66667"
                            />
                            <path
                              d={svgPaths.p32ab0300}
                              id="Vector_2"
                              stroke="var(--stroke-0, #99A1AF)"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.66667"
                            />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <div className="h-[20px] relative shrink-0 w-full">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#364153] text-[14px] top-[-0.2px] whitespace-nowrap">
                      Password
                    </p>
                  </div>
                  <div className="h-[49.6px] relative shrink-0 w-full">
                    <div className="absolute h-[49.6px] left-0 rounded-[10px] top-0 w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password"
                        className="content-stretch flex items-center overflow-clip px-[40px] py-[12px] relative rounded-[inherit] size-full font-['Inter:Regular',sans-serif] font-normal text-[16px] border-[#d1d5dc] border-[0.8px] border-solid focus:outline-none focus:ring-2 focus:ring-[#e17100]"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="absolute content-stretch flex h-[49.6px] items-center left-0 pl-[12px] top-0 w-[32px] pointer-events-none">
                      <div className="relative shrink-0 size-[20px]">
                        <svg
                          className="absolute block inset-0 size-full"
                          fill="none"
                          preserveAspectRatio="none"
                          viewBox="0 0 20 20"
                        >
                          <g id="Icon">
                            <path
                              d={svgPaths.p2566d000}
                              id="Vector"
                              stroke="var(--stroke-0, #99A1AF)"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.66667"
                            />
                            <path
                              d={svgPaths.p1bf79e00}
                              id="Vector_2"
                              stroke="var(--stroke-0, #99A1AF)"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.66667"
                            />
                          </g>
                        </svg>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute content-stretch flex h-[49.6px] items-center right-0 pr-[12px] top-0 w-[32px] cursor-pointer hover:opacity-70 transition-opacity"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-[#99A1AF]" />
                      ) : (
                        <Eye className="w-5 h-5 text-[#99A1AF]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#e17100] h-[48px] relative rounded-[10px] shrink-0 to-[#f54900] w-full hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] left-1/2 not-italic text-[16px] text-center text-white top-[9.8px] whitespace-nowrap">
                    {isLoading ? "Loading..." : "Login"}
                  </p>
                </button>

                {/* Register Link */}
                <div className="h-[20px] relative shrink-0 w-full text-center">
                  <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-1/2 not-italic text-[#4a5565] text-[14px] top-[-0.2px] whitespace-nowrap">
                    Belum punya akun?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="text-[#e17100] font-semibold hover:underline"
                    >
                      Daftar sekarang
                    </button>
                  </p>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="content-stretch flex flex-col h-[133.6px] items-start pt-[24.8px] relative shrink-0 w-full">
                <div
                  aria-hidden="true"
                  className="absolute border-[#e5e7eb] border-solid border-t-[0.8px] inset-0 pointer-events-none"
                />
                <div className="bg-[#eff6ff] h-[108.8px] relative rounded-[10px] shrink-0 w-full">
                  <div
                    aria-hidden="true"
                    className="absolute border-[#bedbff] border-[0.8px] border-solid inset-0 pointer-events-none rounded-[10px]"
                  />
                  <div className="content-stretch flex flex-col gap-[8px] items-start pb-[0.8px] pt-[16.8px] px-[16.8px] relative size-full">
                    <div className="h-[20px] relative shrink-0 w-full">
                      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#193cb8] text-[14px] top-[-0.2px] whitespace-nowrap">
                        Test Account (Supabase):
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col gap-[4px] h-[47.2px] items-start relative shrink-0 w-full">
                      <div className="h-[21.6px] relative shrink-0 w-full">
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-0 not-italic text-[#1447e6] text-[0px] top-[-0.2px] whitespace-nowrap">
                          <span className="leading-[20px] text-[14px]">{`Email: `}</span>
                          <span className="font-['Consolas:Bold',sans-serif] leading-[20px] text-[14px]">
                            test@example.com
                          </span>
                        </p>
                      </div>
                      <div className="h-[21.6px] relative shrink-0 w-full">
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-0 not-italic text-[#1447e6] text-[0px] top-[-0.2px] whitespace-nowrap">
                          <span className="leading-[20px] text-[14px]">{`Password: `}</span>
                          <span className="font-['Consolas:Bold',sans-serif] leading-[20px] text-[14px]">
                            password123
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="h-[20px] relative shrink-0 w-full">
            <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-1/2 not-italic text-[#4a5565] text-[14px] text-center top-[-0.2px] whitespace-nowrap">{`© 2026 Paradose & Parasoes UMKM. All rights reserved.`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
