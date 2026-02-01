"use client";
import { useState } from "react";
import Button from "../Components/Atoms/Button";
import Dropdown from "../Components/Molecules/Dropdown";

const DashboardCard = ({ days, svg, title, className }) => {
  return (
    <div
      className={`flex flex-col w-[164px] relative h-fit ${className} border-gray-200 overflow-hidden border  rounded-2xl gap-8 p-3`}
    >
      <p className=" text-2xl text-black">{days}</p>
      <p className="text-sm text-black opacity-60">{title}</p>
      {svg && (
        <div className="absolute top-0 translate-x-[12px] right-0 -translate-y-[12px]">
          {svg}
        </div>
      )}
    </div>
  );
};

const Feedbackcard = ({}) => {
  return (
    <div className="flex rounded-md p-2 bg-white shadow-sm shadow-gray-200 border-t border-l border-gray-100 w-full text-sm ">
      <div className="flex w-full items-center gap-3">
        <p className="h-12 aspect-square  shadow-sm shadow-lime-400   bg-lime-400 font-space-grotesk text-md font-bold rounded-md flex items-center justify-center ">
          41%
        </p>

        <div className="flex w-full gap-1">
          <p>DESIGN a FAQ Page</p>
          <p>FOR a landing page</p>
          <p>TO HELP designers</p>
        </div>
      </div>
      {/* <div className="w-full justify-end flex">
        <Button>View</Button>
      </div> */}
      <p className="h-12 aspect-square bg-gray-100 text-gray-500  font-space-grotesk text-md font-bold rounded-md flex items-center justify-center ">
        <i className="fa-solid fa-eye" />
      </p>
    </div>
  );
};

const Feedbackdate = ({ date }) => {
  return (
    <div className="flex gap-4">
      <div className="flex  flex-col w-fit gap-3 items-center">
        <p className="text-xs uppercase font-space-mono text-gray-400">
          {date}
        </p>
        <div className="w-px grow  bg-gray-400" />
      </div>
      <div className="gap-3 pb-9 flex flex-col w-full">
        <Feedbackcard />
        <Feedbackcard />
      </div>
    </div>
  );
};
const Dashboard = () => {
  const cards = [
    {
      days: 2,
      svg: (
        <svg
          width="80"
          height="80"
          viewBox="0 0 102 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke-width="1px"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M99.7433 16.5999L79.7433 26.5999L75.4532 24.12L57.7032 13.87L56.5732 13.22L57.1533 12.93L76.5732 3.21997L99.7433 16.5999Z"
            stroke="#229EFF"
            stroke-linejoin="round"
          />
          <path
            d="M79.7437 26.5999V53.19L72.0237 48.7299V37.21L65.9236 40.69L46.5338 51.74L31.7037 26.15L31.0937 25.0999L27.3137 27.2599L7.92371 38.31L2.51367 28.9799L31.0937 12.47L31.7637 13.6299L37.2037 23.02L46.5338 39.11L60.4837 31.31L66.0137 28.21L66.6137 27.8799L65.4236 27.19L56.5737 22.09V13.22L57.7037 13.87L75.4537 24.12L79.7437 26.5999Z"
            stroke="#229EFF"
            stroke-linejoin="round"
          />
          <path
            d="M31.7038 26.1499L27.9238 28.3099L7.92383 38.3099L27.3138 27.2599L31.0938 25.0999L31.7038 26.1499Z"
            stroke="#229EFF"
            stroke-linejoin="round"
          />
          <path
            d="M72.0242 37.21V38.61L66.5342 41.74L46.5342 51.74L65.9241 40.69L72.0242 37.21Z"
            stroke="#229EFF"
            stroke-linejoin="round"
          />
          <path
            d="M99.7441 16.5999V43.1899L79.7441 53.1899V26.5999L99.7441 16.5999Z"
            stroke="#229EFF"
            stroke-linejoin="round"
          />
          <path
            d="M66.0138 28.21L60.4838 31.31L46.5338 39.11L37.2037 23.02L31.7638 13.6299L31.0938 12.47L51.0938 2.46997L57.1538 12.93L56.5737 13.22V22.09L65.4237 27.19L66.0138 28.21Z"
            stroke="#229EFF"
            stroke-linejoin="round"
          />
        </svg>
      ),
      title: "Interviewed Today",
    },
    {
      days: 4,
      svg: (
        <svg
          viewBox="0 0 101 125"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          height="80"
          width="80"
          stroke-width="1px"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M54.9296 104.066C54.9296 108.566 53.5196 111.606 50.7196 113.156C47.9096 114.706 44.4996 114.326 40.4896 112.016C36.4796 109.696 33.0696 106.146 30.2696 101.346C29.2996 99.6762 28.4896 98.0261 27.8496 96.3961C26.6596 93.3361 26.0596 90.3361 26.0596 87.3961C26.0596 85.2761 26.4196 83.4362 27.1396 81.8762C27.8596 80.3162 28.8996 79.1461 30.2696 78.3661L32.3396 77.2462L36.5796 74.9362L40.4896 72.8162L46.9896 83.8462L50.7196 90.1761C51.8096 92.0661 52.6996 93.9562 53.3696 95.8462C53.5496 96.3062 53.6996 96.7662 53.8396 97.2262C54.5596 99.5762 54.9296 101.856 54.9296 104.066Z"
            stroke="#FF4E4C"
            stroke-linejoin="round"
          />
          <path
            d="M98.9802 85.5862C98.9802 93.6862 97.2602 100.076 93.8102 104.756C91.8602 107.406 89.5602 109.406 86.9202 110.746L86.6702 110.866L67.2402 120.586C69.7502 119.236 71.9402 117.296 73.8102 114.756C77.2602 110.076 78.9802 103.686 78.9802 95.5862C78.9802 87.4862 77.2202 78.8562 73.6902 69.9662C73.6202 69.7962 73.5502 69.6262 73.4902 69.4562C69.9802 60.7662 65.4002 52.8962 59.7402 45.8362L73.8302 38.7862H73.8402L79.7402 35.8362C85.5102 43.0362 90.1602 51.0762 93.6902 59.9662C97.2202 68.8562 98.9802 77.4062 98.9802 85.5862Z"
            stroke="#FF4E4C"
            stroke-linejoin="round"
          />
          <path
            d="M73.8302 38.7862L59.7402 45.8362L57.5702 47.6162C56.5302 48.4862 55.3902 48.8862 54.1402 48.8162C52.9002 48.7462 51.6002 48.3162 50.2302 47.5262C47.7502 46.0862 45.5002 43.8062 43.5002 40.6662C41.4902 37.5362 40.4902 34.2662 40.4902 30.8562V12.6362L60.4902 2.63623V20.8562C60.4902 24.2662 61.4902 27.5362 63.5002 30.6662C65.5002 33.8062 67.7502 36.0862 70.2302 37.5262C71.4902 38.2462 72.6902 38.6762 73.8302 38.7862Z"
            stroke="#FF4E4C"
            stroke-linejoin="round"
          />
          <path
            d="M78.98 95.5862C78.98 103.686 77.26 110.076 73.81 114.756C71.94 117.296 69.75 119.236 67.24 120.586C65.12 121.726 62.79 122.436 60.22 122.716C61.58 121.296 62.64 119.486 63.41 117.306C64.17 115.126 64.55 112.566 64.55 109.616C64.55 108.536 64.5 107.436 64.39 106.326C64.31 105.426 64.19 104.516 64.03 103.596C63.74 101.816 63.3 100.006 62.74 98.1562C61.54 94.1962 59.82 90.2762 57.57 86.4062L48.09 70.2862L47.51 69.3062L41.16 58.4862L40.49 57.3562L26.68 65.0062L23.53 66.7562C21.21 68.0762 19.44 70.0062 18.24 72.5262C17.04 75.0562 16.44 78.1562 16.44 81.8362C16.44 84.7862 16.82 87.7862 17.58 90.8462C18.34 93.9162 19.4 96.9362 20.77 99.9362C15.15 92.8262 10.62 84.9462 7.17 76.2862C3.73 67.6262 2 59.2462 2 51.1462C2 41.4862 4.01 34.0362 8.02 28.8062C12.03 23.5762 16.44 19.7762 21.25 17.3962C21.63 17.2062 22 17.0262 22.38 16.8562C26.08 15.1262 29.54 13.9962 32.76 13.4662C33.34 13.3662 33.91 13.2962 34.48 13.2362L40.49 12.6362V30.8562C40.49 34.2662 41.49 37.5362 43.5 40.6662C45.5 43.8062 47.75 46.0862 50.23 47.5262C51.6 48.3162 52.9 48.7462 54.14 48.8162C55.39 48.8862 56.53 48.4862 57.57 47.6162L59.74 45.8362C65.4 52.8962 69.98 60.7662 73.49 69.4562C73.55 69.6262 73.62 69.7962 73.69 69.9662C77.22 78.8562 78.98 87.4062 78.98 95.5862Z"
            stroke="#FF4E4C"
            stroke-linejoin="round"
          />
          <path
            d="M60.4899 2.63623L40.4899 12.6362L34.4799 13.2362C33.9099 13.2962 33.3399 13.3662 32.7599 13.4662C29.5399 13.9962 26.0799 15.1262 22.3799 16.8562L41.2499 7.39621C46.0599 5.02621 50.4699 3.63621 54.4799 3.23621L60.4899 2.63623Z"
            stroke="#FF4E4C"
            stroke-linejoin="round"
          />
          <path
            d="M38.2404 62.5262C37.0404 65.0562 36.4404 68.1562 36.4404 71.8362C36.4404 72.8662 36.4904 73.8962 36.5804 74.9362L32.3404 77.2462L30.2704 78.3662C28.9004 79.1462 27.8604 80.3162 27.1404 81.8762C26.4204 83.4362 26.0604 85.2762 26.0604 87.3962C26.0604 90.3362 26.6604 93.3362 27.8504 96.3962L20.7704 99.9362C19.4004 96.9362 18.3404 93.9162 17.5804 90.8462C16.8204 87.7862 16.4404 84.7862 16.4404 81.8362C16.4404 78.1562 17.0404 75.0562 18.2404 72.5262C19.4404 70.0062 21.2104 68.0762 23.5304 66.7562L26.6804 65.0062L40.4904 57.3562L41.1604 58.4862C39.9704 59.5962 38.9904 60.9462 38.2404 62.5262Z"
            stroke="#FF4E4C"
            stroke-linejoin="round"
          />
          <path
            d="M54.9302 104.066C54.9302 101.856 54.5602 99.5762 53.8402 97.2262C53.7002 96.7662 53.5502 96.3062 53.3702 95.8462C52.7002 93.9562 51.8102 92.0661 50.7202 90.1761L46.9902 83.8462L40.4902 72.8162L47.5102 69.3062L48.0902 70.2862L57.5702 86.4062C59.8202 90.2762 61.5402 94.1962 62.7402 98.1562C63.3002 100.006 63.7402 101.816 64.0302 103.596C64.1902 104.516 64.3102 105.426 64.3902 106.326L50.7202 113.156C53.5202 111.606 54.9302 108.566 54.9302 104.066Z"
            stroke="#FF4E4C"
            stroke-linejoin="round"
          />
        </svg>
      ),
      title: "Day Streak",
    },
    {
      days: 12,
      svg: (
        <svg
          width="80"
          height="80"
          viewBox="0 0 92 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke-width="1px"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M50.0908 18.0733L30.0908 28.0733L22.541 23.7133L2.54102 12.1633L22.541 2.16333L50.0908 18.0733Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M50.0908 18.0734V45.1734L30.0908 55.1734V28.0734L50.0908 18.0734Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M38.481 87.1233L30.0908 91.3133V82.2733L37.021 86.2733L38.481 87.1233Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M50.0908 102.863V117.453L30.0908 127.453V100.343L41.9009 94.4434V98.1334L50.0908 102.863Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M69.4609 86.9333V114.043L50.0908 102.863L41.9009 98.1333V89.0933L38.481 87.1233L37.021 86.2733L30.0908 82.2733V91.3133L28.6309 90.4733L22.541 86.9533L20.251 85.6333V94.6633L22.541 95.9833L30.0908 100.343V127.453L2.54102 111.543V84.4333L12.3809 90.1233V81.0833L10.9209 80.2433L2.54102 75.4033V48.3033L12.3809 53.9833V44.9533L10.9209 44.1133L2.54102 39.2633V12.1633L22.541 23.7133L30.0908 28.0733V55.1733L28.6309 54.3333L22.541 50.8133L20.251 49.4933V58.5233L22.541 59.8433L30.0908 64.2133V73.2433L32.3809 74.5633L40.251 79.1133L41.9009 80.0633V71.0233L50.0908 75.7533L61.9009 82.5733L69.4609 86.9333Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M89.4604 76.9333L69.4604 86.9333L61.9004 82.5733L50.0903 75.7533L41.9004 71.0233L53.5105 65.2133L61.9004 61.0233L89.4604 76.9333Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M53.511 65.2133L41.9009 71.0233V80.0633L40.251 79.1133L32.3809 74.5633L30.0908 73.2433L32.3809 72.1033L50.0908 63.2433L53.511 65.2133Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M50.0908 54.2134V63.2434L32.3809 72.1034L30.0908 73.2434V64.2134L50.0908 54.2134Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M89.4609 76.9333V104.043L69.4609 114.043V86.9333L89.4609 76.9333Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M50.0908 54.2133L30.0908 64.2133L22.541 59.8433L20.251 58.5233L22.541 57.3833L28.6309 54.3333L30.0908 55.1733L41.7109 49.3633L50.0908 54.2133Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M28.6309 54.3333L22.541 57.3833L20.251 58.5233V49.4933L22.541 50.8133L28.6309 54.3333Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M12.3809 44.9533V53.9833L2.54102 48.3033L10.9209 44.1133L12.3809 44.9533Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M12.3809 81.0833V90.1233L2.54102 84.4333L10.9209 80.2433L12.3809 81.0833Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M41.9009 89.0933V94.4433L30.0908 100.343L22.541 95.9833L20.251 94.6633L22.541 93.5233L28.6309 90.4733L30.0908 91.3133L38.481 87.1233L41.9009 89.0933Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
          <path
            d="M28.6309 90.4733L22.541 93.5233L20.251 94.6633V85.6333L22.541 86.9533L28.6309 90.4733Z"
            stroke="#A479FF"
            stroke-linejoin="round"
          />
        </svg>
      ),
      title: "Total Interviews",
    },
  ];

  const intensity = ["low", "medium", "high", "very high"];
  const intensityColor = [
    "bg-gray-100",
    "bg-orange-200",
    "bg-orange-300",
    "bg-orange-400",
    "bg-orange-500",
  ];
  const [selected, setSelected] = useState("2025");
  const [intensityLevel, setIntensityLevel] = useState(0);
  return (
    <div className="flex gap-8 items-start">
      <div className="flex gap-6 flex-col sticky top-8 border-gray-300">
        {/* <p className="text-xl  font-semibold">Welcome Back, Junheng! 👋</p> */}
        {/* <div className="flex flex-col p-8 rounded-2xl bg-white  border border-gray-200 gap-4"></div> */}
        <div className="flex items-center gap-2">
          <img
            src="https://media.licdn.com/dms/image/v2/D4D03AQETIIyyKiIEgA/profile-displayphoto-scale_400_400/B4DZmDuvANJUAg-/0/1758851690918?e=1767830400&v=beta&t=TXd9AiCYUbB0pqif2lfsNjG9xcgHwoPe0gqL5EUME_k"
            alt="Junheng"
            className="w-12 aspect-square bg-gray-200 rounded-full"
          />
          <div className="flex flex-col">
            <p className="text-xl">Hello Junheng! 👋</p>
            <p className="text-sm text-gray-500">
              Let&apos;s get interviewing!
            </p>
          </div>
        </div>
        <div className="w-full pl-4 group  bg-linear-to-r relative  from-orange-500 to-orange-600 pr-3 py-3 cursor-pointer text-sm flex items-end justify-between rounded-xl border border-black/10 shadow-sm shadow-orange-200  text-white">
          <p className="  transition-all text-lg  duration-300">
            Start <i>Interviewing</i>
          </p>
          {/* <div className="w-8 aspect-square  transition-all duration-300 rounded-lg bg-white shadow-sm shadow-gray-black/5 flex items-center justify-center">
                <i className="fa-solid  fa-pencil text-orange-600" />
              </div> */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 120 92"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke-width="2px"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M117.88 65.61V85.61C117.89 86.14 117.72 86.61 117.38 87.02C117.04 87.44 116.57 87.82 115.97 88.17C115.36 88.51 114.7 88.79 113.99 88.98C113.27 89.18 112.45 89.27 111.55 89.27L69.7599 89.2C68.0999 89.2 66.6399 88.83 65.3799 88.11C64.1299 87.38 63.4599 86.52 63.3799 85.51V65.51C63.4599 66.52 64.1299 67.38 65.3799 68.11C66.6399 68.83 68.0999 69.19 69.7599 69.2H74.0699L92.2299 69.24L105.02 69.26H111.55C112.45 69.27 113.27 69.18 113.99 68.98C114.7 68.79 115.36 68.51 115.97 68.17C116.57 67.82 117.04 67.44 117.38 67.02C117.57 66.79 117.7 66.55 117.78 66.29C117.85 66.08 117.88 65.85 117.88 65.61Z"
              stroke="#E0E0E0"
              stroke-linejoin="round"
            />
            <path
              d="M60.4496 6.25V6.27C60.4496 7.26 59.8097 8.14 58.5297 8.87L13.2596 35.01C11.9796 35.75 10.4596 36.12 8.7196 36.11C6.9796 36.11 5.46961 35.74 4.16961 34.99C2.87961 34.24 2.23961 33.37 2.22961 32.36C2.21961 31.36 2.85965 30.49 4.14965 29.75L49.4196 3.61C50.6996 2.86 52.2196 2.5 53.9596 2.5C55.6996 2.5 57.2096 2.88 58.5096 3.62C59.7996 4.37 60.4396 5.24 60.4496 6.25Z"
              stroke="#E0E0E0"
              stroke-linejoin="round"
            />
            <path
              d="M117.88 65.61C117.88 65.85 117.85 66.08 117.78 66.29C117.7 66.55 117.57 66.79 117.38 67.02C117.04 67.44 116.57 67.82 115.97 68.17C115.36 68.51 114.7 68.79 113.99 68.98C113.27 69.18 112.45 69.27 111.55 69.27H105.02L92.2298 69.24L74.0698 69.21H69.7598C68.0998 69.19 66.6398 68.83 65.3798 68.11C64.1298 67.38 63.4598 66.52 63.3798 65.51C63.3798 64.78 63.6898 64.12 64.2998 63.56C64.5598 63.3 64.8698 63.07 65.2398 62.86C66.4898 62.14 68.0198 61.79 69.8298 61.79L79.3698 61.81L95.9498 61.84L48.6898 34.55L45.0398 32.44C43.7498 31.7 43.0998 30.82 43.0898 29.82C43.0898 28.81 43.7298 27.94 45.0098 27.2C46.2898 26.46 47.7998 26.09 49.5398 26.09C51.2798 26.09 52.7998 26.47 54.0898 27.21L57.7498 29.32L105 56.61L105.04 41.47C105.03 40.5 105.63 39.65 106.84 38.91C108.05 38.17 109.56 37.8 111.38 37.81C113.04 37.81 114.52 38.18 115.81 38.93C117.1 39.67 117.75 40.53 117.75 41.49L117.88 65.61Z"
              stroke="#E0E0E0"
              stroke-linejoin="round"
            />
            <path
              d="M95.9498 61.84L79.3698 61.81L69.8298 61.79C68.0198 61.79 66.4898 62.14 65.2398 62.86C64.8698 63.07 64.5598 63.3 64.2998 63.56L45.0398 52.44C43.7498 51.7 43.0998 50.82 43.0898 49.82V29.82C43.0998 30.82 43.7498 31.7 45.0398 32.44L48.6898 34.55L95.9498 61.84Z"
              stroke="#E0E0E0"
              stroke-linejoin="round"
            />
            <path
              d="M60.4495 6.27V26.25C60.4595 27.25 59.8195 28.13 58.5295 28.87L57.7495 29.32L54.0895 27.21C52.7995 26.47 51.2795 26.09 49.5395 26.09C47.7995 26.09 46.2895 26.46 45.0095 27.2C43.7295 27.94 43.0895 28.81 43.0895 29.82V37.79L13.2595 55.01C11.9795 55.75 10.4595 56.12 8.71948 56.11C6.97948 56.11 5.46949 55.74 4.16949 54.99C2.87949 54.24 2.23949 53.37 2.22949 52.36V32.36C2.23949 33.37 2.87949 34.24 4.16949 34.99C5.46949 35.74 6.97948 36.11 8.71948 36.11C10.4595 36.12 11.9795 35.75 13.2595 35.01L58.5295 8.87C59.8095 8.14 60.4495 7.26 60.4495 6.27Z"
              stroke="#E0E0E0"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div className="flex gap-2">
          {cards.map((card) => (
            <DashboardCard key={card.days} {...card} bgColor={card.bgColor} />
          ))}
        </div>
      </div>
      {/* <div className="grow w-px bg-gray-200" /> */}
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col h-fit gap-6 p-8 shadow-md rounded-2xl bg-white shadow-gray-200  border-t border-l border-gray-100 w-full">
          <div className="flex border-b border-gray-200 text-xs gap-4">
            {["2025", "2024", "2023", "2022", "2021"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`uppercase group cursor-pointer flex flex-col gap-4 font-space-mono ${
                  selected === cat ? "text-orange-600" : ""
                }`}
              >
                <span className="group-hover:-translate-y-1 transition-all duration-300">
                  {cat}
                </span>
                {selected === cat && (
                  <div className="w-full h-px bg-orange-600" />
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex">
              {[
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ].map((day, index) => (
                <p
                  key={index}
                  className="text-[10px] uppercase font-space-mono text-gray-400 w-full"
                >
                  {day}
                </p>
              ))}
            </div>
            <div className="grid grid-rows-7 grid-flow-col grid-cols-[repeat(53,1fr)] gap-1 w-full">
              {Array.from({ length: 365 }).map((_, i) => {
                // eslint-disable-next-line react-hooks/purity
                const level = Math.floor(Math.random() * intensity.length);

                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-xs ${intensityColor[level]}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-4  p-8 shadow-md rounded-2xl bg-white shadow-gray-200  border-t border-l border-gray-100 w-full">
          <div className="flex  flex-col gap-3 w-full">
            {/* <div className="flex justify-between w-full">
            <p className="uppercase font-semibold font-space-grotesk">
              Recent Submissions
            </p>

            <Button icon="fa-solid fa-arrow-right">View All</Button>
          </div> */}
            <div className="flex flex-col">
              <Feedbackdate date="10.24" />
              <Feedbackdate date="10.24" />
              <Feedbackdate date="10.24" />
              <Feedbackdate date="10.24" />
              {/* <Feedbackdate date="10.24" />
            <Feedbackdate date="10.24" />
            <Feedbackdate date="10.24" />
            <Feedbackdate date="10.24" /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

{
  /* <div className="flex items-center gap-2">
            <div className="w-16 aspect-square bg-gray-200 rounded-full" />
            <div className="flex flex-col">
              <p className="font-space-grotesk text-lg font-semibold">
                WELCOME BACK, JUNHENG! 👋
              </p>
              <p className="text-sm text-gray-500">
                Let&apos;s get interviewing!
              </p>
            </div>
          </div> */
}
{
  /* <button className="flex px-6 py-4 rounded-full bg-orange-500 items-center cursor-pointer hover:scale-98 transition-all duration-300 active:scale-90 text-white gap-2 font-space-grotesk">
            Start Interviewing
            <i className="fa-solid fa-play" />
          </button> */
}
