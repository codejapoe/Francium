import Header from '../components/header';
import RootLayout from "../pages/layout";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from 'appwrite';
import { messaging } from "../../../notifications/firebase.js"
import { onMessage } from "firebase/messaging";
import { useToast } from "@/components/ui/use-toast.js";
import bcrypt from "bcryptjs";
import { decryptPassword } from "@/lib/functions/password-manager";
import { Loader2 } from 'lucide-react'

export default function TermsAndConditions() {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [verified, setVerified] = useState(false);
    const [profile, setProfile] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const verifyUser = async () => {
        try {
          setLoading(true);
          
          // Check for required cookies
          if (!Cookies.get('user_id') || !Cookies.get('email') || !Cookies.get('password')) {
            setUsername("");
            return false;
          }

          const response = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            [
              Query.equal('$id', Cookies.get('user_id'))
            ]
          );

          if (response.documents.length) {
            const password = decryptPassword(Cookies.get('password') || "404");
            return new Promise((resolve) => {
              bcrypt.compare(password, response.documents[0].password, (err, isMatch) => {
                if (isMatch || password === import.meta.env.VITE_GOOGLE_PASSWORD) {
                  setUsername(response.documents[0].username);
                  setName(response.documents[0].name);
                  setProfile(response.documents[0].profile);
                  setVerified(response.documents[0].verified);

                  // Setup notification handling
                  try {
                    if (messaging) {
                      onMessage(messaging, (payload) => {
                        toast({
                          title: "New Notification!",
                          description: payload.notification.body,
                          duration: 3000,
                        });
                      });
                    }
                  } catch (error) {
                  }

                  resolve(true);
                } else {
                  resolve(false);
                }
              });
            });
          }
          return false;
        } catch (error) {
          return false;
        } finally {
          setLoading(false);
        }
      };

      verifyUser();
    }, []);
    
      if (loading) {
        return (
          <div className="min-h-screen flex flex-col space-y-4 items-center justify-center">
            <Loader2 className="animate-spin" />
            Loading...
          </div>
        );
      }

    return (
        <RootLayout>
        <div className="min-h-screen bg-background text-foreground">
            <Header activeTab="#" username={username} name={name} profile={profile} verified={verified}/>
            <div className="container pt-4 pb-10">
                <strong>Terms &amp; Conditions</strong>
                <br />
                <p>
                    These terms and conditions apply to the Francium app (hereby referred to as
                    "Application") for mobile devices that was created by Codejapoe (hereby
                    referred to as "Service Provider") as an Open Source service.
                </p>
                <br />
                <p>
                    Upon downloading or utilizing the Application, you are automatically
                    agreeing to the following terms. It is strongly advised that you thoroughly
                    read and understand these terms prior to using the Application. Unauthorized
                    copying, modification of the Application, any part of the Application, or
                    our trademarks is strictly prohibited. Any attempts to extract the source
                    code of the Application, translate the Application into other languages, or
                    create derivative versions are not permitted. All trademarks, copyrights,
                    database rights, and other intellectual property rights related to the
                    Application remain the property of the Service Provider.
                </p>
                <br />
                <p>
                    The Service Provider is dedicated to ensuring that the Application is as
                    beneficial and efficient as possible. As such, they reserve the right to
                    modify the Application or charge for their services at any time and for any
                    reason. The Service Provider assures you that any charges for the
                    Application or its services will be clearly communicated to you.
                </p>
                <br />
                <p>
                    The Application stores and processes personal data that you have provided to
                    the Service Provider in order to provide the Service. It is your
                    responsibility to maintain the security of your phone and access to the
                    Application. The Service Provider strongly advise against jailbreaking or
                    rooting your phone, which involves removing software restrictions and
                    limitations imposed by the official operating system of your device. Such
                    actions could expose your phone to malware, viruses, malicious programs,
                    compromise your phone's security features, and may result in the Application
                    not functioning correctly or at all.
                </p>
                {/**/}
                <br />
                <p>
                    Please be aware that the Service Provider does not assume responsibility for
                    certain aspects. Some functions of the Application require an active
                    internet connection, which can be Wi-Fi or provided by your mobile network
                    provider. The Service Provider cannot be held responsible if the Application
                    does not function at full capacity due to lack of access to Wi-Fi or if you
                    have exhausted your data allowance.
                </p>
                <br />
                <p>
                    If you are using the application outside of a Wi-Fi area, please be aware
                    that your mobile network provider's agreement terms still apply.
                    Consequently, you may incur charges from your mobile provider for data usage
                    during the connection to the application, or other third-party charges. By
                    using the application, you accept responsibility for any such charges,
                    including roaming data charges if you use the application outside of your
                    home territory (i.e., region or country) without disabling data roaming. If
                    you are not the bill payer for the device on which you are using the
                    application, they assume that you have obtained permission from the bill
                    payer.
                </p>
                <br />
                <p>
                    Similarly, the Service Provider cannot always assume responsibility for your
                    usage of the application. For instance, it is your responsibility to ensure
                    that your device remains charged. If your device runs out of battery and you
                    are unable to access the Service, the Service Provider cannot be held
                    responsible.
                </p>
                <br />
                <p>
                    In terms of the Service Provider's responsibility for your use of the
                    application, it is important to note that while they strive to ensure that
                    it is updated and accurate at all times, they do rely on third parties to
                    provide information to them so that they can make it available to you. The
                    Service Provider accepts no liability for any loss, direct or indirect, that
                    you experience as a result of relying entirely on this functionality of the
                    application.
                </p>
                <br />
                <p>
                    The Service Provider may wish to update the application at some point. The
                    application is currently available as per the requirements for the operating
                    system (and for any additional systems they decide to extend the
                    availability of the application to) may change, and you will need to
                    download the updates if you want to continue using the application. The
                    Service Provider does not guarantee that it will always update the
                    application so that it is relevant to you and/or compatible with the
                    particular operating system version installed on your device. However, you
                    agree to always accept updates to the application when offered to you. The
                    Service Provider may also wish to cease providing the application and may
                    terminate its use at any time without providing termination notice to you.
                    Unless they inform you otherwise, upon any termination, (a) the rights and
                    licenses granted to you in these terms will end; (b) you must cease using
                    the application, and (if necessary) delete it from your device.
                </p>
                <br />
                <strong>Changes to These Terms and Conditions</strong>
                <p>
                    The Service Provider may periodically update their Terms and Conditions.
                    Therefore, you are advised to review this page regularly for any changes.
                    The Service Provider will notify you of any changes by posting the new Terms
                    and Conditions on this page.
                </p>
                <br />
                <p>These terms and conditions are effective as of 2030-12-31</p>
                <br />
                <strong>Contact Us</strong>
                <p>
                    If you have any questions or suggestions about the Terms and Conditions,
                    please do not hesitate to contact the Service Provider at
                    codejapoe@gmail.com.
                </p>
                <br/>
                <hr/>
            </div>
        </div>
        </RootLayout>
    )
}