"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BellIcon,
  BoxCubeIcon,
  BoxIconLine,
  ChevronDownIcon,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  PieChartIcon,
  PlugInIcon,
  ShootingStarIcon,
  TaskIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <GroupIcon />,
    name: "Khách hàng & CSKH",
    subItems: [
      { name: "Khách hàng", path: "/customers", pro: false },
      { name: "Phiếu hỗ trợ", path: "/ticket", pro: false },
      { name: "Nhiệm vụ CSKH", path: "/get-task", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Kho hàng",
    subItems: [
      { name: "Quản lý kho", path: "/warehouses", pro: false },
      { name: "Tồn kho", path: "/inventory", pro: false },
      { name: "Giao dịch kho", path: "/inventory/transactions", pro: false },
      { name: "Phiếu chuyển kho", path: "/inventory/stock-transfers", pro: false },
      { name: "Nhập kho", path: "/inventory/transactions/import", pro: false },
      { name: "Xuất kho", path: "/inventory/transactions/export", pro: false },
      { name: "Chuyển kho", path: "/inventory/transactions/transfer", pro: false },
      { name: "Cảnh báo tồn kho", path: "/inventory/alerts", pro: false },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: "Mua hàng",
    subItems: [
      { name: "Đơn đặt hàng", path: "/purchase-orders", pro: false },
      { name: "Nhà cung cấp", path: "/suppliers", pro: false },
    ],
  },
  {
    icon: <BoxIconLine />,
    name: "Vật tư & Hàng hóa",
    subItems: [
      { name: "Danh mục", path: "/categories", pro: false },
      { name: "Nguyên liệu", path: "/material", pro: false },
      { name: "Bao bì", path: "/packaging", pro: false },
      { name: "Thành phẩm", path: "/finished-product", pro: false },
      { name: "Sản phẩm", path: "/goods", pro: false },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "Sản xuất",
    subItems: [
      { name: "Công thức (BOM)", path: "/production/bom", pro: false },
      { name: "Lệnh sản xuất", path: "/production/orders", pro: false },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: "Bán hàng",
    subItems: [
      { name: "Đơn hàng", path: "/sales/orders", pro: false },
      { name: "Giao hàng", path: "/sales/deliveries", pro: false },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: "Khuyến mãi",
    subItems: [
      { name: "Danh sách KM", path: "/promotions", pro: false },
      { name: "KM đang chạy", path: "/promotions/active", pro: false },
    ],
  },
  {
    icon: <DollarLineIcon />,
    name: "Tài chính",
    subItems: [
      { name: "Phiếu thu", path: "/finance/receipts", pro: false },
      { name: "Phiếu chi", path: "/finance/vouchers", pro: false },
      { name: "Đối chiếu công nợ", path: "/finance/debt-reconciliation", pro: false },
      { name: "Quỹ tiền mặt", path: "/finance/cash-fund", pro: false },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "Nhân sự",
    subItems: [
      { name: "Nhân viên", path: "/users", pro: false },
      { name: "Chấm công", path: "/hr/attendance", pro: false },
      { name: "Tăng ca", path: "/hr/overtime", pro: false, new: true },
      { name: "Lương", path: "/hr/salary", pro: false },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Báo cáo",
    subItems: [
      { name: "Doanh thu", path: "/reports/revenue", pro: false },
      { name: "Tồn kho", path: "/reports/inventory", pro: false },
      { name: "Bán hàng", path: "/reports/sales", pro: false },
      { name: "Sản xuất", path: "/reports/production", pro: false },
      { name: "Tài chính", path: "/reports/financial", pro: false },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "Tin tức",
    subItems: [
      { name: "Danh sách tin", path: "/news", pro: false },
      { name: "Danh mục", path: "/news-categories", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Cài đặt",
    subItems: [
      { name: "Hồ sơ cá nhân", path: "/profile", pro: false },
      { name: "Vai trò & Quyền", path: "/settings/roles", pro: false },
      { name: "Cài đặt hệ thống", path: "/settings/system", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => {
    if (path === pathname) return true;

    if (path === '/') return false;

    if (pathname.startsWith(path + '/')) {
      const allSubItems = [...navItems, ...othersItems]
        .flatMap(nav => nav.subItems || [])
        .filter(subItem => subItem.path !== path);

      const hasMoreSpecificMatch = allSubItems.some(subItem =>
        pathname === subItem.path ||
        (pathname.startsWith(subItem.path + '/') && subItem.path.length > path.length)
      );

      return !hasMoreSpecificMatch;
    }

    return false;
  }, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div
        className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Image
                  className="dark:hidden"
                  src="/images/logo/logo-nobackground.png"
                  alt="Logo"
                  width={80}
                  height={48}
                  // style={{ width: "auto", height: "auto" }}
                />
                <Image
                  className="hidden dark:block"
                  src="/images/logo/logo-nobackground.png"
                  alt="Logo"
                  width={80}
                  height={48}
                  // style={{ width: "auto", height: "auto" }}
                />
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    Quản Lý ERP
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sản xuất & Bán hàng
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Image
              src="/images/logo/logo-nobackground.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
    </aside>
  );
};

export default AppSidebar;
