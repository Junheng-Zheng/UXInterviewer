import Image from "next/image";
import Animatedlink from "../Atoms/Animatedlink";
const Footer = () => {
  return (
    <div className="bg-white mono uppercase">
      <div className="flex  relative px-5 z-1 bg-white border-t border-gray-200 py-12 lg:px-24 lg:py-12 flex-col gap-16 w-full">
        <div className="w-12 h-12 relative">
          <Image src="/landingpage/logo.png" alt="logo" fill />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex md:flex-row flex-col md:justify-between gap-16 md:items-end">
            <div className="flex  gap-12">
              <div className="flex flex-col gap-4">
                <Animatedlink href="#about">Home</Animatedlink>
                <Animatedlink href="#works">Pricing</Animatedlink>
                <Animatedlink href="#philosophy">Sign In</Animatedlink>
              </div>
              <div className="flex flex-col gap-4">
                <Animatedlink link="https://www.linkedin.com/in/junhengzheng/">
                  Sign Up
                </Animatedlink>
                <Animatedlink link="https://github.com/junheng-zheng">
                  LinkedIn
                </Animatedlink>
                <Animatedlink link="https://mail.google.com/mail/?view=cm&fs=1&to=jz7259@g.rit.edu">
                  Contact Us
                </Animatedlink>
              </div>
            </div>
            <p className="text-sm text-inverse">
              © 2026 UXInterviewer. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-gray-100 z-0 lg:px-24 px-5 lg:py-12 py-6 sticky bottom-0 w-full">
        <svg
          width="100%"
          height="auto"
          viewBox="0 0 198 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-10"
        >
          <path
            d="M10.7813 0H14.4716V11.3352C14.4716 12.608 14.1676 13.7216 13.5597 14.6761C12.9574 15.6307 12.1136 16.375 11.0284 16.9091C9.94318 17.4375 8.67898 17.7017 7.2358 17.7017C5.78693 17.7017 4.51989 17.4375 3.43466 16.9091C2.34943 16.375 1.50568 15.6307 0.903409 14.6761C0.301136 13.7216 0 12.608 0 11.3352V0H3.69034V11.0199C3.69034 11.6847 3.83523 12.2756 4.125 12.7926C4.42045 13.3097 4.83523 13.7159 5.36932 14.0114C5.90341 14.3068 6.52557 14.4545 7.2358 14.4545C7.9517 14.4545 8.57386 14.3068 9.10227 14.0114C9.63636 13.7159 10.0483 13.3097 10.3381 12.7926C10.6335 12.2756 10.7813 11.6847 10.7813 11.0199V0Z"
            fill="black"
          />
          <path
            d="M20.968 0L24.4879 5.94886H24.6243L28.1612 0H32.3288L27.0021 8.72727L32.4482 17.4545H28.2038L24.6243 11.4972H24.4879L20.9084 17.4545H16.6811L22.1442 8.72727L16.7834 0H20.968Z"
            fill="black"
          />
          <path d="M38.3544 0V17.4545H34.6641V0H38.3544Z" fill="black" />
          <path
            d="M55.9901 0V17.4545H52.8026L45.2088 6.46875H45.081V17.4545H41.3906V0H44.6293L52.1634 10.9773H52.3168V0H55.9901Z"
            fill="black"
          />
          <path
            d="M58.3743 3.04261V0H72.7095V3.04261H67.3658V17.4545H63.718V3.04261H58.3743Z"
            fill="black"
          />
          <path
            d="M75.0703 17.4545V0H86.8317V3.04261H78.7607V7.2017H86.2266V10.2443H78.7607V14.4119H86.8658V17.4545H75.0703Z"
            fill="black"
          />
          <path
            d="M89.7656 17.4545V0H96.652C97.9702 0 99.0952 0.235795 100.027 0.707386C100.964 1.1733 101.678 1.83523 102.166 2.69318C102.661 3.54545 102.908 4.5483 102.908 5.7017C102.908 6.8608 102.658 7.85795 102.158 8.69318C101.658 9.52273 100.933 10.1591 99.9844 10.6023C99.0412 11.0455 97.8992 11.267 96.5582 11.267H91.9474V8.30114H95.9616C96.6662 8.30114 97.2514 8.20455 97.7173 8.01136C98.1832 7.81818 98.5298 7.52841 98.7571 7.14205C98.9901 6.75568 99.1065 6.27557 99.1065 5.7017C99.1065 5.12216 98.9901 4.63352 98.7571 4.2358C98.5298 3.83807 98.1804 3.53693 97.7088 3.33239C97.2429 3.12216 96.6548 3.01705 95.9446 3.01705H93.456V17.4545H89.7656ZM99.1918 9.51136L103.53 17.4545H99.456L95.2116 9.51136H99.1918Z"
            fill="black"
          />
          <path
            d="M108.2 0L112.419 13.2614H112.581L116.808 0H120.899L114.882 17.4545H110.126L104.101 0H108.2Z"
            fill="black"
          />
          <path d="M126.69 0V17.4545H123V0H126.69Z" fill="black" />
          <path
            d="M129.727 17.4545V0H141.488V3.04261H133.417V7.2017H140.883V10.2443H133.417V14.4119H141.522V17.4545H129.727Z"
            fill="black"
          />
          <path
            d="M148.351 17.4545L143.357 0H147.388L150.277 12.1278H150.422L153.609 0H157.061L160.24 12.1534H160.393L163.283 0H167.314L162.32 17.4545H158.723L155.399 6.04261H155.263L151.947 17.4545H148.351Z"
            fill="black"
          />
          <path
            d="M169.289 17.4545V0H181.05V3.04261H172.979V7.2017H180.445V10.2443H172.979V14.4119H181.085V17.4545H169.289Z"
            fill="black"
          />
          <path
            d="M183.984 17.4545V0H190.871C192.189 0 193.314 0.235795 194.246 0.707386C195.183 1.1733 195.896 1.83523 196.385 2.69318C196.879 3.54545 197.126 4.5483 197.126 5.7017C197.126 6.8608 196.876 7.85795 196.376 8.69318C195.876 9.52273 195.152 10.1591 194.203 10.6023C193.26 11.0455 192.118 11.267 190.777 11.267H186.166V8.30114H190.18C190.885 8.30114 191.47 8.20455 191.936 8.01136C192.402 7.81818 192.749 7.52841 192.976 7.14205C193.209 6.75568 193.325 6.27557 193.325 5.7017C193.325 5.12216 193.209 4.63352 192.976 4.2358C192.749 3.83807 192.399 3.53693 191.928 3.33239C191.462 3.12216 190.874 3.01705 190.163 3.01705H187.675V17.4545H183.984ZM193.411 9.51136L197.749 17.4545H193.675L189.43 9.51136H193.411Z"
            fill="black"
          />
        </svg>
      </div>
    </div>
  );
};

export default Footer;
