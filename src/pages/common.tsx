import { useSite } from "../site";

/** The deployment's contact address (REST_MAIL_CONTACT), as a link. */
export const ContactAddress = () => {
  const { contact } = useSite();
  return <a href={`mailto:${contact}`}>{contact}</a>;
};

/** A repository of the project on GitHub. */
export const Repo = ({ name }: { name: string }) => (
  <a href={`https://github.com/rest-mail/${name}`}>rest-mail/{name}</a>
);
