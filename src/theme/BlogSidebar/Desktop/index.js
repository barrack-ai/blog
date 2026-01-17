import React, {memo} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import {useVisibleBlogSidebarItems} from '@docusaurus/plugin-content-blog/client';
import BlogSidebarContent from '@theme/BlogSidebar/Content';
import styles from './styles.module.css';

const ListComponent = ({items}) => {
  return (
    <ul className={clsx(styles.sidebarItemList, 'clean-list')}>
      {items.map((item) => (
        <li key={item.permalink} className={styles.sidebarItem}>
          <Link
            isNavLink
            to={item.permalink}
            className={styles.sidebarItemLink}
            activeClassName={styles.sidebarItemLinkActive}>
            {item.title}
          </Link>
          {(item.date || item.readingTime) && (
            <span className={styles.sidebarItemMeta}>
              {item.formattedDate && <span>{item.formattedDate}</span>}
              {item.formattedDate && item.readingTime && <span> · </span>}
              {item.readingTime && <span>{Math.ceil(item.readingTime)} min read</span>}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};

function BlogSidebarDesktop({sidebar}) {
  const items = useVisibleBlogSidebarItems(sidebar.items);
  return (
    <aside className="col col--3">
      <nav
        className={clsx(styles.sidebar, 'thin-scrollbar')}
        aria-label={translate({
          id: 'theme.blog.sidebar.navAriaLabel',
          message: 'Blog recent posts navigation',
          description: 'The ARIA label for recent posts in the blog sidebar',
        })}>
        <div className={clsx(styles.sidebarItemTitle, 'margin-bottom--md')}>
          {sidebar.title}
        </div>
        <BlogSidebarContent
          items={items}
          ListComponent={ListComponent}
          yearGroupHeadingClassName={styles.yearGroupHeading}
        />
      </nav>
    </aside>
  );
}
export default memo(BlogSidebarDesktop);
